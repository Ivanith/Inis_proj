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




