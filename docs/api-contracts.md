---
title: NestJS Backend Template API v1.0.0
language_tabs:
  - "[]": "[]"
language_clients:
  - "[]": ""
toc_footers: []
includes: []
search: false
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="nestjs-backend-template-api">NestJS Backend Template API v1.0.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

## Overview
A production-ready NestJS backend template with JWT authentication, RBAC, file uploads, email service, and more.

## Authentication
Use **Bearer Token** authentication. Obtain a token via `POST /auth/login`.

## Response Format
All responses follow a unified structure:
- **Success**: `{ success: true, data: ... }`
- **Error**: `{ success: false, error: { statusCode, message } }`

## Rate Limiting
- Max **5 requests/second** per IP
- Max **100 requests/minute** per IP

Base URLs:

Email: <a href="mailto:support@yourapp.com">Support</a> Web: <a href="https://yourapp.com">Support</a> 
License: <a href="https://opensource.org/licenses/MIT">MIT</a>

# Authentication

- HTTP Authentication, scheme: bearer Enter your JWT access token

<h1 id="nestjs-backend-template-api-auth">Auth</h1>

Authentication endpoints – register, login, token refresh, password management

## AuthController_register

<a id="opIdAuthController_register"></a>

> Code samples

`POST /auth/register`

*Register a new user account*

> Body parameter

```json
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

<h3 id="authcontroller_register-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[RegisterDto](#schemaregisterdto)|true|none|

<h3 id="authcontroller_register-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|User registered successfully with tokens|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Email already in use|None|

<aside class="success">
This operation does not require authentication
</aside>

## AuthController_login

<a id="opIdAuthController_login"></a>

> Code samples

`POST /auth/login`

*Authenticate user and receive JWT tokens*

> Body parameter

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

<h3 id="authcontroller_login-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[LoginDto](#schemalogindto)|true|none|

<h3 id="authcontroller_login-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Login successful with access & refresh tokens|None|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Invalid credentials|None|

<aside class="success">
This operation does not require authentication
</aside>

## AuthController_refreshTokens

<a id="opIdAuthController_refreshTokens"></a>

> Code samples

`POST /auth/refresh`

*Refresh access token using a valid refresh token*

> Body parameter

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

<h3 id="authcontroller_refreshtokens-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[RefreshTokenDto](#schemarefreshtokendto)|true|none|

<h3 id="authcontroller_refreshtokens-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|New access & refresh tokens issued|None|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Invalid or expired refresh token|None|

<aside class="success">
This operation does not require authentication
</aside>

## AuthController_logout

<a id="opIdAuthController_logout"></a>

> Code samples

`POST /auth/logout`

*Logout and invalidate the refresh token*

<h3 id="authcontroller_logout-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Logged out successfully|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
None
</aside>

## AuthController_forgotPassword

<a id="opIdAuthController_forgotPassword"></a>

> Code samples

`POST /auth/forgot-password`

*Request a password reset email*

> Body parameter

```json
{
  "email": "user@example.com"
}
```

<h3 id="authcontroller_forgotpassword-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[ForgotPasswordDto](#schemaforgotpassworddto)|true|none|

<h3 id="authcontroller_forgotpassword-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Reset email sent if account exists|None|

<aside class="success">
This operation does not require authentication
</aside>

## AuthController_resetPassword

<a id="opIdAuthController_resetPassword"></a>

> Code samples

`POST /auth/reset-password`

*Reset password using the token received via email*

> Body parameter

```json
{
  "token": "string",
  "newPassword": "newSecurePassword123"
}
```

<h3 id="authcontroller_resetpassword-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[ResetPasswordDto](#schemaresetpassworddto)|true|none|

> Example responses

> 200 Response

```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

<h3 id="authcontroller_resetpassword-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Password reset successfully|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Invalid or expired token|Inline|

<h3 id="authcontroller_resetpassword-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="nestjs-backend-template-api-users">Users</h1>

User management – CRUD operations (Admin protected)

## UsersController_getProfile

<a id="opIdUsersController_getProfile"></a>

> Code samples

`GET /users/me`

*Get current authenticated user profile*

<h3 id="userscontroller_getprofile-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|User profile returned|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
JWT-auth
</aside>

## UsersController_updateProfile

<a id="opIdUsersController_updateProfile"></a>

> Code samples

`PUT /users/me`

*Update current authenticated user profile*

> Body parameter

```json
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "isActive": true,
  "password": "newSecurePassword123"
}
```

<h3 id="userscontroller_updateprofile-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[UpdateUserDto](#schemaupdateuserdto)|true|none|

<h3 id="userscontroller_updateprofile-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Profile updated successfully|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
JWT-auth
</aside>

## UsersController_updateFcmToken

<a id="opIdUsersController_updateFcmToken"></a>

> Code samples

`PATCH /users/fcm-token`

*Update FCM token for current user*

<h3 id="userscontroller_updatefcmtoken-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|FCM token updated|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
JWT-auth
</aside>

## UsersController_findAll

<a id="opIdUsersController_findAll"></a>

> Code samples

`GET /users`

*[Admin] List all users with pagination*

<h3 id="userscontroller_findall-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|page|query|number|false|Page number (1-based)|
|limit|query|number|false|Number of items per page|
|sortBy|query|string|false|Field to sort by|
|sortOrder|query|string|false|Sort direction|

#### Enumerated Values

|Parameter|Value|
|---|---|
|sortOrder|asc|
|sortOrder|desc|

<h3 id="userscontroller_findall-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Paginated list of users|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
JWT-auth
</aside>

## UsersController_findById

<a id="opIdUsersController_findById"></a>

> Code samples

`GET /users/{id}`

*[Admin] Get a user by ID*

<h3 id="userscontroller_findbyid-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|User UUID|

<h3 id="userscontroller_findbyid-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|User found|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|User not found|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
JWT-auth
</aside>

## UsersController_update

<a id="opIdUsersController_update"></a>

> Code samples

`PUT /users/{id}`

*[Admin] Update any user (including role & isActive)*

> Body parameter

```json
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "isActive": true,
  "password": "newSecurePassword123"
}
```

<h3 id="userscontroller_update-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|User UUID|
|body|body|[UpdateUserDto](#schemaupdateuserdto)|true|none|

<h3 id="userscontroller_update-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|User updated successfully|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
JWT-auth
</aside>

## UsersController_remove

<a id="opIdUsersController_remove"></a>

> Code samples

`DELETE /users/{id}`

*[Admin] Delete a user permanently*

<h3 id="userscontroller_remove-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|User UUID|

<h3 id="userscontroller_remove-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|User deleted successfully|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
JWT-auth
</aside>

<h1 id="nestjs-backend-template-api-upload">Upload</h1>

File upload endpoints – single & multiple file uploads

## UploadController_uploadSingle

<a id="opIdUploadController_uploadSingle"></a>

> Code samples

`POST /upload/single`

*Upload a single file (image, PDF, or video)*

> Body parameter

```yaml
file: string

```

<h3 id="uploadcontroller_uploadsingle-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|true|none|
|» file|body|string(binary)|false|none|

<h3 id="uploadcontroller_uploadsingle-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|File uploaded successfully|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
None
</aside>

## UploadController_uploadMultiple

<a id="opIdUploadController_uploadMultiple"></a>

> Code samples

`POST /upload/multiple`

*Upload multiple files (up to 10)*

> Body parameter

```yaml
files:
  - string

```

<h3 id="uploadcontroller_uploadmultiple-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|true|none|
|» files|body|[string]|false|none|

<h3 id="uploadcontroller_uploadmultiple-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Files uploaded successfully|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
None
</aside>

## UploadController_deleteFile

<a id="opIdUploadController_deleteFile"></a>

> Code samples

`DELETE /upload/{fileName}`

*Delete an uploaded file by filename*

<h3 id="uploadcontroller_deletefile-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|fileName|path|string|true|none|

<h3 id="uploadcontroller_deletefile-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|File deleted successfully|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|File not found|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
None
</aside>

<h1 id="nestjs-backend-template-api-health">Health</h1>

System health checks – database, memory

## HealthController_check

<a id="opIdHealthController_check"></a>

> Code samples

`GET /health`

*Check system health status (DB + memory)*

> Example responses

> 200 Response

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

<h3 id="healthcontroller_check-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|All systems operational

The Health Check is successful|Inline|
|503|[Service Unavailable](https://tools.ietf.org/html/rfc7231#section-6.6.4)|One or more services are down

The Health Check is not successful|Inline|

<h3 id="healthcontroller_check-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» status|string|false|none|none|
|» info|object¦null|false|none|none|
|»» **additionalProperties**|object|false|none|none|
|»»» status|string|true|none|none|
|» error|object¦null|false|none|none|
|»» **additionalProperties**|object|false|none|none|
|»»» status|string|true|none|none|
|» details|object|false|none|none|
|»» **additionalProperties**|object|false|none|none|
|»»» status|string|true|none|none|

Status Code **503**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» status|string|false|none|none|
|» info|object¦null|false|none|none|
|»» **additionalProperties**|object|false|none|none|
|»»» status|string|true|none|none|
|» error|object¦null|false|none|none|
|»» **additionalProperties**|object|false|none|none|
|»»» status|string|true|none|none|
|» details|object|false|none|none|
|»» **additionalProperties**|object|false|none|none|
|»»» status|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

# Schemas

<h2 id="tocS_RegisterDto">RegisterDto</h2>
<!-- backwards compatibility -->
<a id="schemaregisterdto"></a>
<a id="schema_RegisterDto"></a>
<a id="tocSregisterdto"></a>
<a id="tocsregisterdto"></a>

```json
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|email|string|true|none|none|
|password|string|true|none|none|
|firstName|string|false|none|none|
|lastName|string|false|none|none|

<h2 id="tocS_LoginDto">LoginDto</h2>
<!-- backwards compatibility -->
<a id="schemalogindto"></a>
<a id="schema_LoginDto"></a>
<a id="tocSlogindto"></a>
<a id="tocslogindto"></a>

```json
{
  "email": "test@example.com",
  "password": "password123"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|email|string|true|none|none|
|password|string|true|none|none|

<h2 id="tocS_RefreshTokenDto">RefreshTokenDto</h2>
<!-- backwards compatibility -->
<a id="schemarefreshtokendto"></a>
<a id="schema_RefreshTokenDto"></a>
<a id="tocSrefreshtokendto"></a>
<a id="tocsrefreshtokendto"></a>

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|refreshToken|string|true|none|none|

<h2 id="tocS_ForgotPasswordDto">ForgotPasswordDto</h2>
<!-- backwards compatibility -->
<a id="schemaforgotpassworddto"></a>
<a id="schema_ForgotPasswordDto"></a>
<a id="tocSforgotpassworddto"></a>
<a id="tocsforgotpassworddto"></a>

```json
{
  "email": "user@example.com"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|email|string|true|none|none|

<h2 id="tocS_ResetPasswordDto">ResetPasswordDto</h2>
<!-- backwards compatibility -->
<a id="schemaresetpassworddto"></a>
<a id="schema_ResetPasswordDto"></a>
<a id="tocSresetpassworddto"></a>
<a id="tocsresetpassworddto"></a>

```json
{
  "token": "string",
  "newPassword": "newSecurePassword123"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|token|string|true|none|Password reset token received via email|
|newPassword|string|true|none|none|

<h2 id="tocS_UpdateUserDto">UpdateUserDto</h2>
<!-- backwards compatibility -->
<a id="schemaupdateuserdto"></a>
<a id="schema_UpdateUserDto"></a>
<a id="tocSupdateuserdto"></a>
<a id="tocsupdateuserdto"></a>

```json
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "isActive": true,
  "password": "newSecurePassword123"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|email|string|false|none|none|
|firstName|string|false|none|none|
|lastName|string|false|none|none|
|role|string|false|none|none|
|isActive|boolean|false|none|none|
|password|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|role|USER|
|role|ADMIN|

