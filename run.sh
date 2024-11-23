#!/usr/bin/with-contenv bashio

echo "==> Starting Matterflow API backend"

source /matterflow/api/venv/bin/activate

#Start supervisord
cd /matterflow/api
supervisord -c ./supervisord.conf 

cd /matterflow/api/mf

#Migrate the sql database
python3 manage.py migrate

#Start the server
PYTHONWARNINGS="ignore" python3 manage.py runserver &
echo "Matterflow API backend started!"

echo "==> Starting Matterflow Web application"

cd /matterflow/web
#npm run dev
npm run preview
echo "Matterflow Web application started!"
