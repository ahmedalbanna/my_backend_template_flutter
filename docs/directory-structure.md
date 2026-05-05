# Backend Directory Structure

Generated on: 5/6/2026, 1:32:11 AM

```text
|   app.controller.spec.ts
|   app.controller.ts
|   app.module.ts
|   app.service.ts
|   main.ts
|   
+---common
|   +---decorators
|   |       current-user.decorator.ts
|   |       public.decorator.ts
|   |       roles.decorator.ts
|   |       
|   +---dto
|   |       pagination.dto.ts
|   |       
|   +---filters
|   |       http-exception.filter.ts
|   |       
|   +---guards
|   |       jwt-auth.guard.ts
|   |       roles.guard.ts
|   |       
|   +---interceptors
|   |       transform.interceptor.ts
|   |       
|   +---interfaces
|   \---pipes
+---config
|       configuration.ts
|       swagger.config.ts
|       
+---modules
|   +---auth
|   |   |   auth.controller.ts
|   |   |   auth.module.ts
|   |   |   auth.repository.ts
|   |   |   auth.service.spec.ts
|   |   |   auth.service.ts
|   |   |   
|   |   +---dto
|   |   |       forgot-password.dto.ts
|   |   |       login.dto.ts
|   |   |       refresh-token.dto.ts
|   |   |       register.dto.ts
|   |   |       reset-password.dto.ts
|   |   |       
|   |   +---entities
|   |   \---strategies
|   |           jwt.strategy.ts
|   |           
|   +---health
|   |       health.controller.ts
|   |       health.module.ts
|   |       
|   +---notifications
|   |       notifications.cron.ts
|   |       notifications.module.ts
|   |       notifications.service.ts
|   |       
|   \---users
|       |   users.controller.ts
|       |   users.module.ts
|       |   users.repository.ts
|       |   users.service.ts
|       |   
|       +---dto
|       |       update-user.dto.ts
|       |       
|       \---entities
\---shared
    +---audit
    |       audit-log.decorator.ts
    |       audit.module.ts
    |       audit.service.ts
    |       
    +---email
    |   |   email.module.ts
    |   |   email.service.ts
    |   |   
    |   \---templates
    |           reset-password.template.ts
    |           welcome.template.ts
    |           
    +---firebase
    |       firebase.module.ts
    |       firebase.service.ts
    |       
    +---prisma
    |       prisma.module.ts
    |       prisma.service.ts
    |       
    +---queue
    |       email.processor.ts
    |       queue.module.ts
    |       queue.service.ts
    |       
    \---upload
            upload.controller.ts
            upload.module.ts
            upload.service.ts
```
