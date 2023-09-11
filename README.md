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
"friends": []
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
> [!IMPORTANT] 
> **Bearer Token required**

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
> [!IMPORTANT]
> **Bearer Token required**

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

## GET methods

### Get me
> [!IMPORTANT]
> **Bearer Token required**

```
route: http://localhost:4444/users/me?skip=0 // "skip" hide provided value of games in response.
                                             // request shows only 10 user games

```

**response:**

```
"user": {
        "_id": 
        "userName": 
        "email":
        "friends": []
        "avatarUrl":
        "preferedColor":
        "units":
        "preferences":
        "rating": 
        "totalGames":
        "winrate": 
        "wins":
         "games": [
        {
            "_id": 
            "duration":
            "rounds":
            "numberOfPlayers": 
            "players": [ ]
            "gameSpeed": 
            "ranked": 
            "winner": [ ]
            "createdAt":
            "updatedAt": 
            "__v": 
            } 
    }
```

### Get all users (leaderboard)
> [!IMPORTANT]
> **Bearer Token required**

```
route: http://localhost:4444/leaderboard
```

**response:**

```
     {
        "_id": 
        "userName": 
        "rating": 
        "totalGames": 
        "winrate": 
    },

```

### Get user by id
> [!IMPORTANT]
> **Bearer Token required**

```
route: http://localhost:4444/users/:user_id?skip=0                          // "skip" hide provided value of games in response.
example: http://localhost:4444/users/64f7a31d8ac60cbf1421c447?skip=0        // request shows only 10 user games
```

**response:**

```
 "user": {
        "_id": 
        "userName": 
        "friends": [],
        "avatarUrl": 
        "rating": 
        "totalGames": 
        "winrate": 
        "wins": 
    },
    "games": [
        {
            "_id": 
            "duration": 
            "rounds": 
            "numberOfPlayers": 
            "players": [],
            "gameSpeed": 
            "ranked": 
            "winner": [],
            "createdAt": 
            "updatedAt": 
            "__v": 
        },

```

### Search user
> [!IMPORTANT]
> **Bearer Token required**

```
route: http://localhost:4444/users/search/"search option"
example: http://localhost:4444/users/search/USER            //Search is performed only by username
```

**response:**

```
     [
    {
        "_id": 
        "userName": 
        "avatarUrl": 
    },
    
]

```

### Get file (image)
> [!IMPORTANT]
> **Bearer Token required**

```
route: http://localhost:4444/uploads/"filename"
example: http://localhost:4444/uploads/test_image.jpg 
```

**response:**

```
//returs provided file if it uploaded on server
```

## PATCH methods

### Update me
> [!IMPORTANT]
> **Bearer Token required**

```
route: http://localhost:4444/users/me
body:

    "avatarUrl":        //String
    "preferedColor":    //String
    "units":            //String
    "preferences":      //String


```

**response:**

//returns modified document, for example:

```
{
    "_id": "64f7a31d8ac60cbf1421c447",
    "userName": "FirstUser",
    "email": "firsttest@gmail.com",
    "friends": [
        "64fbac10883178dc7fb317f3",
        "64fbac47883178dc7fb317f5"
    ],
    "createdAt": "2023-09-05T21:52:29.398Z",
    "updatedAt": "2023-09-11T20:54:00.474Z",
    "__v": 4,
    "avatarUrl": "http://localhost:4444/uploads/test_image.jpg",
    "preferedColor": "Blue",
    "units": "Navy blue",
    "preferences": "none",
    "rating": 100,
    "totalGames": 3,
    "winrate": 67,
    "wins": 2
}
```
### Update my pass
> [!IMPORTANT]
> **Bearer Token required**

```
route: http://localhost:4444/users/me/pass
body:

   "password":           //old password
    "newPassword":       // new pass (min 5 symbols)


```

**response:**

```
  "message": "Password changed successfully" // Password changed
  "message": "Wrong password"               // old password provided is incorrect

```

## DELETE methods
> [!IMPORTANT]
> **Bearer Token required**

### Remove friend

```
route: http://localhost:4444/users/add/:user_id
example: http://localhost:4444/users/add/64fbac47883178dc7fb317f5

```

**response:**

```
    "message": "friend removed successfully" 
```