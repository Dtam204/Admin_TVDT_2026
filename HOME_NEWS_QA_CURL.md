# HOME + NEWS QA CURL CHECKLIST (2026-04-10)

## Base URL
```bash
http://localhost:5000
```

## A. Home APIs (du 9 API)

### 1) Health check Home
```bash
curl -X GET "http://localhost:5000/api/public/home" -H "accept: application/json"
```

### 2) Suggest books
```bash
curl -X GET "http://localhost:5000/api/public/home/get-suggest-books?pageIndex=1&pageSize=10" -H "accept: application/json"
```

### 3) Updated books
```bash
curl -X GET "http://localhost:5000/api/public/home/get-updated-books?pageIndex=1&pageSize=10" -H "accept: application/json"
```

### 4) Most viewed books of week
```bash
curl -X GET "http://localhost:5000/api/public/home/get-most-viewed-books-of-the-week?pageIndex=1&pageSize=10" -H "accept: application/json"
```

### 5) Most borrowed documents
```bash
curl -X GET "http://localhost:5000/api/public/home/get-most-borrowed-documents?pageIndex=1&pageSize=10" -H "accept: application/json"
```

### 6) Top favorite
```bash
curl -X GET "http://localhost:5000/api/public/home/get-top-favorite?pageIndex=1&pageSize=10" -H "accept: application/json"
```

### 7) Top recommend
```bash
curl -X GET "http://localhost:5000/api/public/home/get-top-recommend?pageIndex=1&pageSize=5" -H "accept: application/json"
```

### 8) Membership plans
```bash
curl -X GET "http://localhost:5000/api/public/home/membership-plans?page=1&limit=10" -H "accept: application/json"
```

### 9) Membership plan detail
```bash
curl -X GET "http://localhost:5000/api/public/home/membership-plans/1" -H "accept: application/json"
```

## B. News package APIs

### 1) Public news list
```bash
curl -X GET "http://localhost:5000/api/public/news?page=1&limit=10" -H "accept: application/json"
```

### 2) AI news suggest (News tab)
```bash
curl -X GET "http://localhost:5000/api/public/search/ai-news-suggest?query=lap+trinh&pageIndex=1&pageSize=10" -H "accept: application/json"
```

### 3) Public news detail by slug
```bash
curl -X GET "http://localhost:5000/api/public/news/{slug}" -H "accept: application/json"
```

## C. Pass criteria nhanh
- HTTP status `200` cho API hop le.
- Envelope co du: `code`, `success`, `message`, `data`, `errorId`, `appId`, `errors`.
- Home health (`/api/public/home`) tra `total_endpoints = 9`.
- API `ai-news-suggest` co them `pagination` va `ai_interpreted`.