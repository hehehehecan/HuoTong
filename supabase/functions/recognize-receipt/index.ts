import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface RecognizeRequestBody {
  image_base64?: string
}

interface RecognizedItem {
  name: string
  quantity: number
  unit_price: number
}

interface RecognizedResult {
  customer_name: string | null
  supplier_name: string | null
  items: RecognizedItem[]
  total: number | null
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY")
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  let body: RecognizeRequestBody
  try {
    body = (await req.json()) as RecognizeRequestBody
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const imageBase64 = body?.image_base64
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return new Response(JSON.stringify({ error: "image_base64 required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const prompt = `请识别这张单据图片（可能是出货单或进货单），提取以下信息并严格返回一个 JSON 对象，不要返回其他文字：
{
  "customer_name": "客户名称，若无或无法识别则为 null",
  "supplier_name": "供应商名称，若无或无法识别则为 null",
  "items": [{"name": "商品名称", "quantity": 数量(整数), "unit_price": 单价(数字)}],
  "total": 总金额(数字)，若无或无法识别则为 null
}
规则：items 为数组，每项包含 name、quantity、unit_price；无法识别的字段用 null。只返回上述 JSON，不要 markdown 包裹。`

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return new Response(
        JSON.stringify({ error: "Vision API error", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      return new Response(JSON.stringify({ error: "No content from Vision API" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const parsed = JSON.parse(content) as RecognizedResult
    if (!Array.isArray(parsed.items)) parsed.items = []
    const result: RecognizedResult = {
      customer_name: parsed.customer_name ?? null,
      supplier_name: parsed.supplier_name ?? null,
      items: parsed.items.map((i: { name?: string; quantity?: number; unit_price?: number }) => ({
        name: typeof i?.name === "string" ? i.name : "",
        quantity: Number(i?.quantity) || 0,
        unit_price: Number(i?.unit_price) || 0,
      })),
      total: typeof parsed.total === "number" ? parsed.total : null,
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return new Response(
      JSON.stringify({ error: "Recognition failed", details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
