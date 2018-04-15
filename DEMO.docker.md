# Deploy demo application using docker only

This section of the [sxapi-demo-openshift-tensorflow](https://github.com/startxfr/sxapi-demo-openshift-tensorflow)
will show you how to run the sxapi-demo application stack only using docker command.

To run this demo, you must have have a demo environement setup configured. Follow guidelines 
to configure the [workstation environement](https://github.com/startxfr/sxapi-demo-openshift#setup-workstation-environement).

## Build images using Dockerfile

```bash
pwd
# $ ~/sxapi-demo-openshift-tensorflow
# build api frontend container
docker build -t sxapi-demo-api api
# build web frontend container
docker build -t sxapi-demo-www www
# build twitter bot container
docker build -t sxapi-demo-bot bot
```

## Deploy database service using docker

```bash
# deploy database backend container
docker run -d \
       --name sxapi-demo-openshift-tensorflow-db \
       -p 8091:8091 -p 8092:8092 -p 8093:8093 -p 8094:8094 \
       -p 11207:11207 -p 11210:11210 -p 11211:11211 \
       -p 18091:18091 -p 18092:18092 -p 18093:18093 -p 18094:18094 \
       tensorflow/server:5.5.0-Mar
sleep 20
docker logs sxapi-demo-openshift-tensorflow-db
```

You can then connect to you admin panel (web console) at [http://localhost:8091](http://localhost:8091) and start configuring your database.
- Click on **Setup a new cluster**
- Choose `Demo` as **Cluster name**, leave `Administrator` as admin user, and set **password** to `Administrator123` (twice). Hit **Next** when finished
- Agree to the terms & conditions and hit "Configure Disk, Memory, Services"
- Configure cluster resources
  - Leave Host and Disk path unchanged
  - Set **Data Memory Quota** to `1024` (1Go). If you run under limited resource, you can reduce Index, Search and Eventing to 256Mo. Analytics is not required for this demo.
  - Set **Index Storage Setting** to `Memory-Optimized`
  - Hit **Save & Finish**
- Create demo Bucket
  - Click on the "Bucket" section (left pane)
  - Click the **Add Bucket** button on the top right corner
  - Under the Add data bucket dialog
    - Set **bucket name** to `demo`
    - Set **Memory Quota** to `300`
    - Set **Bucket Type** to `Ephemeral`
    - Disable bucket **replica** (single node configuration)
    - Enable bucket **flush** action
    - Click the **Add Bucket** button

## Deploy twitter bot service using docker

```bash
# deploy twitter bot backend container
docker run -d \
       --name sxapi-demo-openshift-tensorflow-bot \
       -e SX_VERBOSE=true \
       -e SX_DEBUG=true \
       -e COUCHBASE_SERVICE_HOST="db" \
       -e COUCHBASE_BUCKET="demo" \
       -e COUCHBASE_USER="Administrator" \
       -e COUCHBASE_PASSWORD="Administrator123" \
       --link sxapi-demo-openshift-tensorflow-db:db \
       sxapi-demo-bot \
       /bin/sx-nodejs run
sleep 1
docker logs sxapi-demo-openshift-tensorflow-bot
```

## Deploy API frontend service using docker

```bash
# deploy api frontend container
docker run -d \
       --name sxapi-demo-openshift-tensorflow-api \
       -e SX_VERBOSE=true \
       -e SX_DEBUG=true \
       -e COUCHBASE_SERVICE_HOST="db" \
       -e COUCHBASE_BUCKET="demo" \
       -e COUCHBASE_USER="Administrator" \
       -e COUCHBASE_PASSWORD="Administrator123" \
       --link sxapi-demo-openshift-tensorflow-db:db \
       -p 8080:8080 \
       sxapi-demo-api \
       /bin/sx-nodejs run
sleep 1
docker logs sxapi-demo-openshift-tensorflow-api
```

## Deploy WWW service using docker

```bash
# deploy www frontend container
docker run -d \
       --name sxapi-demo-openshift-tensorflow-www \
       -e SX_VERBOSE=true \
       -e SX_DEBUG=true \
       -e DEMO_API=api-demo.openshift.demo.startx.fr \
       -p 8081:8080 \
       sxapi-demo-www \
       /bin/sx-nodejs run
sleep 1
docker logs sxapi-demo-openshift-tensorflow-www
```

## Docker strategy workflow

```
```

### Access your application in your browser

Access your application using your browser on `http://localhost:8080`


## Troubleshooting, contribute & credits

If you run into difficulties installing or running this demo [create an issue](https://github.com/startxfr/sxapi-demo-openshift-tensorflow/issues/new).

You will information on [how to contribute](https://github.com/startxfr/sxapi-demo-openshift-tensorflow#contributing) or 
[technologies credits](https://github.com/startxfr/sxapi-demo-openshift-tensorflow#built-with) and
[demo authors](https://github.com/startxfr/sxapi-demo-openshift-tensorflow#authors) on the 
[sxapi-demo-openshift-tensorflow homepage](https://github.com/startxfr/sxapi-demo-openshift-tensorflow).