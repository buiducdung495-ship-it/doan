curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" http://localhost:3000/api/forms
curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" http://localhost:3000/api/requests
curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" http://localhost:3000/api/assets
curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" http://localhost:3000/api/chats?userId=admin-1
curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" http://localhost:3000/api/chats/groups
curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" http://localhost:3000/api/notifications?userId=admin-1
curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" http://localhost:3000/api/payments
