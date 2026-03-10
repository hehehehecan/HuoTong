---
name: 'document-project'
description: '为棕地项目生成文档供 AI 理解。当用户说「文档化此项目」或「生成项目文档」时使用'
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

<steps CRITICAL="TRUE">
1. Always LOAD the FULL {project-root}/_bmad/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config {project-root}/_bmad/bmm/workflows/document-project/workflow.yaml
3. Pass the yaml path {project-root}/_bmad/bmm/workflows/document-project/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
5. Save outputs after EACH section when generating any documents from templates
</steps>
