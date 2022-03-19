# URL Shortener

[![Node.js CI](https://github.com/raywu0123/URL_Shortener/actions/workflows/node.js.yml/badge.svg)](https://github.com/raywu0123/URL_Shortener/actions/workflows/node.js.yml)

## API Specs

1. Upload URL
  * HTTP Request
    `POST /api/v1/urls`
  * Request Body
    - url: string
    - expireAt: string
  * Response
    * Normal (status 200)
      - id: string
      - shortUrl: string
    * Invalid URL or expireAt earlier than current time (status 403)
      - error: string
  * Example
    ```
    curl -X POST -H "Content-Type:application/json" http://localhost/api/v1/urls -d '{
      "url": "http://www.google.com",
      "expireAt": "2021-02-08T09:20:41Z"
    }'

    # Response
    {
      "id": "AAAAAAA",
      "shortUrl": "http://localhost/AAAAAAA"
    }  
    ```
2. Redirect URL
  * HTTP Request
    `GET /:url_id`
  * Path Parameters
    - url_id: string
  * Response
    * Normal (status 200)  
      redirect to original URL
    * Expired or non-existent url_id (status 404)
      - error: string 
  * Example
    ```
    curl -L -X GET http://localhost/AAAAAAA => REDIRECT to http://www.google.com
    ```

## Dev
1. Lint
    ```
    npm build
    ```
2. Test
    ```
    npm test
    ```
3. Update GKE secrets
    ```
    kubectl delete secret mysecret
    kubectl create secret generic mysecret --from-env-file .env
    ```