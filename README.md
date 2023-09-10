## POST methods

### Register

```
route: http://localhost:4444/register
body:
"email" - is email validation
"password" - min 5 symbols
"userName" - min 5 symbols, and must be unique
```

**response:**

```
"_id"
"userName"
"email":
"friends": [],
"createdAt"
"updatedAt"
 "__v"
"token"
```

### Login

```
route: http://localhost:4444/login
body:
"email" - is email validation
"password" - min 5 symbols
```

**response:**

```
"_id"
"userName"
"email":
"friends": [],
"createdAt"
"updatedAt"
 "__v"
"token"
```

### Add friend

**Bearer Token required**

```
route: http://localhost:4444/users/add/:user_id
example: http://localhost:4444/users/add/64f7a31d8ac60cbf1421c447

```

**response:**

```
"message": "Friend added successfully" // now user in friendlist
"message": "You are already friends!" // user was in friendlist
"message": "Failed to add friend" // invalid user_id or other errors

```

### Upload file

**Bearer Token required**

```
route: http://localhost:4444/upload
body:
form-data,
Key:image, Value "file you want to upload"
```

**response:**

```
 "url": "/uploads/${req.file.originalname}"

```
