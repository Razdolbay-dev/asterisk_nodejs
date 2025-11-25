# Авторизация
 curl -X POST http://192.168.88.182:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'


# Посмотреть SIP
 curl -X GET http://192.168.88.182:3000/api/sip \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYXN0ZXJpc2subG9jYWwiLCJpYXQiOjE3NjQwNjk4NDYsImV4cCI6MTc2NDE1NjI0Nn0.FyBnPmbQjd8eiCxqzOlGE-66d7bNqLPweiVJeuaHDtM"

# Создаем новый SIP аккаунт (должен сгенерировать конфиг)
 curl -X POST http://192.168.88.182:3000/api/sip \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYXN0ZXJpc2subG9jYWwiLCJpYXQiOjE3NjQwNjk4NDYsImV4cCI6MTc2NDE1NjI0Nn0.FyBnPmbQjd8eiCxqzOlGE-66d7bNqLPweiVJeuaHDtM" \
  -H "Content-Type: application/json" \
  -d '{"id":"1002","password":"newpassword123","context":"internal"}'

# Проверяем список снапшотов
 curl -X GET http://192.168.88.182:3000/api/config/snapshots \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYXN0ZXJpc2subG9jYWwiLCJpYXQiOjE3NjQwNjk4NDYsImV4cCI6MTc2NDE1NjI0Nn0.FyBnPmbQjd8eiCxqzOlGE-66d7bNqLPweiVJeuaHDtM"


# Создаем снапшот вручную
 curl -X POST http://192.168.88.182:3000/api/config/snapshots \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYXN0ZXJpc2subG9jYWwiLCJpYXQiOjE3NjQwNjk4NDYsImV4cCI6MTc2NDE1NjI0Nn0.FyBnPmbQjd8eiCxqzOlGE-66d7bNqLPweiVJeuaHDtM" \
  -H "Content-Type: application/json" \
  -d '{"comment":"Manual backup"}'


# Статус AMI соединения
 curl -X GET http://192.168.88.182:3000/api/asterisk/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYXN0ZXJpc2subG9jYWwiLCJpYXQiOjE3NjQwNjk4NDYsImV4cCI6MTc2NDE1NjI0Nn0.FyBnPmbQjd8eiCxqzOlGE-66d7bNqLPweiVJeuaHDtM" \

# Информация о системе (вернет данные даже если AMI не подключен)
 curl -X GET http://192.168.88.182:3000/api/asterisk/system-info \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYXN0ZXJpc2subG9jYWwiLCJpYXQiOjE3NjQwNjk4NDYsImV4cCI6MTc2NDE1NjI0Nn0.FyBnPmbQjd8eiCxqzOlGE-66d7bNqLPweiVJeuaHDtM" \


# Получить список очередей
 curl -X GET http://192.168.88.182:3000/api/queues \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYXN0ZXJpc2subG9jYWwiLCJpYXQiOjE3NjQwNjk4NDYsImV4cCI6MTc2NDE1NjI0Nn0.FyBnPmbQjd8eiCxqzOlGE-66d7bNqLPweiVJeuaHDtM" \

# Создать новую очередь
 curl -X POST http://192.168.88.182:3000/api/queues \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYXN0ZXJpc2subG9jYWwiLCJpYXQiOjE3NjQwNjk4NDYsImV4cCI6MTc2NDE1NjI0Nn0.FyBnPmbQjd8eiCxqzOlGE-66d7bNqLPweiVJeuaHDtM" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "sales",
    "name": "Sales Department",
    "strategy": "rrmemory",
    "timeout": 45,
    "wrapuptime": 15,
    "maxlen": 20,
    "members": [
      {
        "interface": "SIP/1001",
        "penalty": 0,
        "membername": "Sales Agent 1"
      },
      {
        "interface": "SIP/1002", 
        "penalty": 1,
        "membername": "Sales Agent 2"
      }
    ]
  }'

# Добавить участника в очередь
 curl -X POST http://192.168.88.182:3000/api/queues/sales/members \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYXN0ZXJpc2subG9jYWwiLCJpYXQiOjE3NjQwNjk4NDYsImV4cCI6MTc2NDE1NjI0Nn0.FyBnPmbQjd8eiCxqzOlGE-66d7bNqLPweiVJeuaHDtM" \
  -H "Content-Type: application/json" \
  -d '{
    "interface": "SIP/1003",
    "penalty": 2,
    "membername": "Sales Agent 3"
  }'

# Получить статус очередей из Asterisk
 curl -X GET http://192.168.88.182:3000/api/asterisk/queues \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYXN0ZXJpc2subG9jYWwiLCJpYXQiOjE3NjQwNjk4NDYsImV4cCI6MTc2NDE1NjI0Nn0.FyBnPmbQjd8eiCxqzOlGE-66d7bNqLPweiVJeuaHDtM" \


# Получить список транков
 curl -X GET http://192.168.88.182:3000/api/trunks \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYXN0ZXJpc2subG9jYWwiLCJpYXQiOjE3NjQwNjk4NDYsImV4cCI6MTc2NDE1NjI0Nn0.FyBnPmbQjd8eiCxqzOlGE-66d7bNqLPweiVJeuaHDtM"

# Создать новый транк
 curl -X POST http://192.168.88.182:3000/api/trunks \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYXN0ZXJpc2subG9jYWwiLCJpYXQiOjE3NjQwNjk4NDYsImV4cCI6MTc2NDE1NjI0Nn0.FyBnPmbQjd8eiCxqzOlGE-66d7bNqLPweiVJeuaHDtM" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "myprovider",
    "name": "My VoIP Provider", 
    "host": "sip.voip-provider.com",
    "port": 5060,
    "username": "myaccount",
    "password": "mysecretpassword",
    "fromuser": "myaccount",
    "context": "from-trunk",
    "qualify": "yes",
    "register": "yes",
    "protocol": "udp"
  }'

# Обновить транк
 curl -X PUT http://192.168.88.182:3000/api/trunks/myprovider \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYXN0ZXJpc2subG9jYWwiLCJpYXQiOjE3NjQwNjk4NDYsImV4cCI6MTc2NDE1NjI0Nn0.FyBnPmbQjd8eiCxqzOlGE-66d7bNqLPweiVJeuaHDtM" \
  -H "Content-Type: application/json" \
  -d '{
    "qualify_frequency": 30,
    "insecure": "port"
  }'