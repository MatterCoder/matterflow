<div align="center">
    <a href="https://github.com/MatterCoder/Matterflow">
        <img width="200" height="150" src="/docs/logo.png">
    </a>
    <div style="display: flex;"><h1>Matterflow</h1></div>
    <br>
    <br>
    <div style="display: flex;">
        <a href="https://github.com/MatterCoder/Matterflow/releases">
            <img src="https://img.shields.io/github/release/MatterCoder/Matterflow.svg">
        </a>
        <a href="https://github.com/MatterCoder/Matterflow/stargazers">
            <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/Mattercoder/Matterflow">
        </a>
        <a href="https://matterflow.slack.com">
            <img src="https://img.shields.io/badge/Slack-channel-red?logo=slack">
        </a>
        <a href="https://matterflow.cloud">
        <img src="https://img.shields.io/badge/Docusaurus-3ECC5F?logo=docusaurus&logoColor=fff"/>    
        </a>           
    </div>
    <h1>Matter IoT Data Pipelines</h1>
</div>

# Overview

Matterflow is a visual tool for working with data from **Matter-enabled IoT devices**, simplifying the process of collecting, transforming, and integrating data from **smart home** systems. With Matterflow, you can **Transform** and **Stream** IoT Data to Cloud and AI Applications. Matterflow can be deployed as a Home Assistant addon or a standalone Docker container. It provides functionality to:

- Automatically **receive and process IoT data**.
- Transform and model data for use in various formats like **CSV** or **JSON**.
- Send processed data to the **Cloud** and **AI applications** or store it locally for further analysis.

Matterflow is ideal for developers, data scientists, and IoT enthusiasts looking to unlock the full potential of their smart devices.

---

## Tutorial
A great place to start is to follow the "Getting Started Tutorial" on our documentation website: https://matterflow.cloud/docs/intro


## Demo video

<a href="https://youtu.be/fyOmPssi-9g" target="_blank">
<img src="web/public/matterflowdemo.png" width="800">
</a>

## Installation

### Server (Django)

```
cd api
```

1. Install and activate python3.12 `virtual environment` 

```
/usr/bin/python3.12 -m venv ./venv
source venv/bin/activate
```

***On Mac OS***
Installing and activating python3.12 on Mac OS

Ensure you install python3.12

```
brew install python@3.12
```

Ensure you use the correct python binary path when activating the environment

```
/usr/local/bin/python3 -m venv ./venv
source venv/bin/activate
```
        
2. Install dependencies
In the `api` directory with `requirements.txt`.
```
pip install -r requirements.txt
```
3. Setup your local environment

- Create environment file with app secret 
```
echo "SECRET_KEY='TEMPORARY SECRET KEY'" > mf/.environment
```

3.1. (Optionally) set location of db-sqlite3 file and tmp config files. Otherwise defaults to /tmp

- Create environment variable your specific db path 
```
echo "DIR_PATH='/data'" >> mf/.environment
```
4. Supervisor - This project requires supervisord to control unix based processes which run the flows in the background. 

4.1. Start/Restart the supervisor

Cd to the `api` directory with `supervisord.conf` file
```
supervisord -c ./supervisord.conf 
```

4.2. Check the status of the supervisor

```
supervisorctl status
```

Note: there should be one process running that is specified in the supervisor_confs folder and defined in the foo.conf file

5. Start dev server from app root
```
cd mf
python manage.py migrate
python manage.py runserver
```
    

### Web Client 
In a separate terminal window, perform the following steps to start the
front-end.

1. Install Prerequisites
```
cd web
npm install
```
2. Start dev server
```
npm run dev
```

By default, your default browser should open on the main
application page. If not, you can go to [http://localhost:5173/](http://localhost:5173/)
in your browser.

### Testing with Storybook

It is possible to locally test the react components in Storybook. The backend is mocked in that case.
If running as Storybook, then the backend API will only provide static information and the
functionality of adding, deleting, modifying, saving etc will not be saved to the backend

1. Run as Storybook
```
cd web
npm run storybook
```

Note: it is not recommended to run as storybook as the lack of backend functionality will 
impact the functionality of the front end.

### Standalone Docker

It is possible to run this application as a docker container on amd64 using
but you will need to know the IP address of your main docker interface
Find the docker0 ip address using  ip a | grep docker0

```
docker run --rm --add-host="localhost:172.17.0.1" -p 4173:4173 -p 9001:9001 -v /data:/data:rw  -v /config:/config oideibrett/image-amd64-matterflow:latest
```


Its essential that you have a Matter Server running and this can be run in Docker using

```
docker run -d \
  --name matter-server \
  --restart=unless-stopped \
  --security-opt apparmor=unconfined \
  -v /data:/data \
  -v /run/dbus:/run/dbus:ro \
  --network=host \
  ghcr.io/home-assistant-libs/python-matter-server:stable --storage-path /data --paa-root-cert-dir /data/credentials --bluetooth-adapter 0
```

### Home Assistant Addon

It is also possible to run this as a Home Assistant Addon

#### Add the Repository

1. Go to the **Add-on store** in Home Assistant.
2. Click **⋮ → Repositories**, and paste the following URL:
   
[https://github.com/MatterCoder/addon-matterflow](https://github.com/MatterCoder/addon-matterflow)

Click **Add → Close**, or click the button below to add the repository directly:  
[![Add Repository](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2FMattercoder%2Faddon-matterflow)


### Credits
The project builds on the work from the [Visual Programming project](https://github.com/PyWorkflowApp/visual-programming) and is based on React, React Bootstrap and [react-diagrams](https://github.com/projectstorm/react-diagrams)
