# Deploy demo application using Openshift build config

This section of the [sxapi-demo-openshift-tensorflow](https://github.com/startxfr/sxapi-demo-openshift-tensorflow)
will show you how to run the sxapi-demo application stack only using openshift commands.

To run this demo, you must have have a demo environement setup configured. Follow guidelines 
to configure the [workstation environement](https://github.com/startxfr/sxapi-demo-openshift#setup-workstation-environement)
and [openshift environement](https://github.com/startxfr/sxapi-demo-openshift#setup-openshift-environement).

## Openshift template

### Pre-requirements

The TensorFlow Operator needs some special permissions in order to interact with the Kubernetes master. 
These permissions need to be set for each project using the TensorFlow Operator. 

```bash
# Need cluster admin access
oc login -u system:admin
# Create and/or connect to the demo project
# oc new-project <project>
oc new-project demo
# Create a cluster-admin user for your project (enable kubernetes dialog and CRD events)
# oc adm policy add-cluster-role-to-user cluster-admin -z <user_name> -n <project>
oc adm policy add-cluster-role-to-user cluster-admin -z default -n demo
# add security context for this user (start as root)
# oc adm policy add-scc-to-user anyuid system:serviceaccount:<project>:<user_name>
oc adm policy add-scc-to-user anyuid system:serviceaccount:demo:default
```

For full explanation on security constrains, read [tensorflow - Openshift RBAC documentation](http://docs.tensorflow.com/prerelease/tensorflow-operator/beta/rbacOpenshift.html)


### Full template

This demo provide an [all-in-one build template](https://raw.githubusercontent.com/startxfr/sxapi-demo-openshift-tensorflow/master/openshift-build-all-ephemeral.yml)
to build and deploy the full application stack using build config and deployement config for every services
part of this example.

This template will create the following objects :
- **1 ImageStream** with 3 tags linked to public bases images `tensorflow/k8s-operator`, `startx/sv-tensorflow` and `startx/sv-nodejs`
- **1 ImageStream** with 3 tag used for hosting the **bot**, **api** and **www** build image
- **2 Secret** holding `tensorflow-auth` and `digit-auth` credentials
- **3 BuildConfig** describing how to build the **bot**, **api** and **www** images
- **4 DeploymentConfig** describing how to deploy and run the **tensorflow**, **bot**, **api** and **www** components
- **3 Service** to expose **bot**, **api** and **www** internaly and/or link them to route objects
- **3 Route** to expose **tensorflow** admin, **api** and **www** externaly
- **1 CRD** to describe the **tensorflow** cluster for the operator

### Running from command line

You can create and use this template running the following command. You can only run it one time per project with an 
identical APP_NAME. 
Source branch corespond to different stage of the application, you can choose 
to deploy various stage with the same project (shared namespace) or in differents projects (isolated namespace).

Don't forget to follow previous requirement before running this command otherwise your tensorflow cluster won't start 
and api as well as bot components will follow 
```bash
oc project demo
oc process -f https://raw.githubusercontent.com/startxfr/sxapi-demo-openshift-tensorflow/master/openshift-build-all-ephemeral.yml \
           -p APP_NAME=digit \
           -p SOURCE_BRANCH=master \
           -p DEMO_API=digit-master-api-demo.openshift.demo.startx.fr \
           -p COUCHBASE_USER="Administrator" \
           -p COUCHBASE_PASSWORD="Administrator123" \
           -p COUCHBASE_BUCKET="demo" | \
oc create -f -
sleep 5
oc get all
```

### Running from web interface

If you run this demo from the web interface, you will face an error explaining that the CRD resource could not be created
You can run the template anyway. 
Your installation will be the partial and you will need to add the 
[tensorflow cluster CRD](https://raw.githubusercontent.com/startxfr/sxapi-demo-openshift-tensorflow/master/openshift-crd-cluster.yml) 
using the CLI.

```bash
oc project demo
oc create -f https://raw.githubusercontent.com/startxfr/sxapi-demo-openshift-tensorflow/master/openshift-crd-cluster.yml
```


## Openshift build and deploy strategy workflow

```
                                                               .----------.
                                                               |   Pod    |
                                                             .>|----------|<.
          .--------------------------.   .-----------------. | | dev-api  | | .----------.
          |       Source code        |   |  DeployConfig   | | '----------' | | Service  |
          |--------------------------|   |-----------------|-. .----------. .------------|
          | sxapi-demo...chbase/www  |   | digit-dev-www   | | |   Pod    | | | dev-www  |
          '--------------------------'   '-----------------' '>|----------|<' '----------'
                              |                   ^            | dev-api  |      /
                              v                   |            '----------'     /
                       .-------------.   .-----------------.        .----------v
                       | BuildConfig |   |    WWW image    |        |  Route   |
                       |-------------|-->|-----------------|        |----------|
                       | digit-www   |   | digit-dev:www   |        | dev-www  |
                       ^-------------'   '-----------------'        '----------\
   .------------------/                                                         v .-,(  ),-.    
   |  Builder image   |                                                        .-(          )-. 
   |------------------|                                                       (    internet    )
   | startx/sv-nodejs |                                                        '-(          ).-'
   '------------------\                                                         ^  '-.( ).-'    
                       v-------------.   .-----------------.        .----------/
                       | BuildConfig |   |    API image    |        |  Route   |
                       |-------------|-->|-----------------|        |----------|
                       | digit-api   |   | digit-dev:api   |        | dev-api  |
                       '-------------'   '-----------------'        '----------^
                              ^                   |                             \
                              |                   |            .----------.      \
                              |                   |            |   Pod    |       \
                              |                   v          .>|----------|<.  .----------.
          .--------------------------.   .-----------------. | | dev-api  | |  | Service  |
          |       Source code        |   |  DeployConfig   | | '----------' .--|----------|
          |--------------------------|   |-----------------|-. .----------. |  | dev-api  |
          | sxapi-demo...chbase/api  |   | digit-dev-api   | | |   Pod    | |  '----------'
          '--------------------------'   '-----------------' '>|----------|<'
                                                               | dev-api  |<--.
                                                               '----------'   |
                                                                     ^        |
                                                                     |        |
.-------------------.  .-------------.   .-----------------.   .----------.   |
|   Builder image   |  | BuildConfig |   |    API image    |   | Service  |   |
|-------------------|->|-------------|-->|-----------------|   |----------|   |
| startx/sv-nodejs  |  | digit-bot   |   | digit-dev:bot   |   | dev-bot  |   |
'-------------------'  '-------------'   '-----------------'   '----------'   |
                              ^                   |                  |        |
                              |                   v                  v        |
          .--------------------------.   .-----------------.   .----------.   |
          |       Source code        |   |  DeployConfig   |   |   Pod    |<-.|
          |--------------------------|   |-----------------|-->|----------|  ||
          | sxapi-demo...chbase/bot  |   | digit-dev-bot   |   | dev-bot  |  ||
          '--------------------------'   '-----------------'   '----------'  ||
                                                                             ||
                                                                             ||
                                                                             ||
  .--------------------.                                                     ||
  |    DeployConfig    |                        .----------------.           ||
  |--------------------|------.                 |      Pod       |           ||
  | tensorflow-operator|      |             .-->|----------------|<--.       ||
  '--------------------'      |             |   | tensorflow-node|   |       ||
                              |             |   '----------------'   |       ||
                              v             |                        |       vv
                   .--------------------.   |   .----------------.   |   .----------------.
                   |        Pod         |---'   |      Pod       |   '---|    Service     |
                   |--------------------|------>|----------------|<------|----------------|
                   | tensorflow-operator|---.   | tensorflow-node|   .---| tensorflow-node|
                   '--------------------'   |   '----------------'   |   '----------------'
                              ^             |                        |
                              |             |   .----------------.   |
  .--------------------.      |             |   |      Pod       |   |
  |        CRD         |      |             '-->|----------------|<--'
  |--------------------|------'                 | tensorflow-node|
  | tensorflow-cluster |                        '----------------'
  '--------------------'
```

### Access your application in your browser

Access your application using your browser on `http://digit-dev-www-demo.openshift.demo.startx.fr`


## Troubleshooting, contribute & credits

If you run into difficulties installing or running this demo [create an issue](https://github.com/startxfr/sxapi-demo-openshift-tensorflow/issues/new).

You will information on [how to contribute](https://github.com/startxfr/sxapi-demo-openshift-tensorflow#contributing) or 
[technologies credits](https://github.com/startxfr/sxapi-demo-openshift-tensorflow#built-with) and
[demo authors](https://github.com/startxfr/sxapi-demo-openshift-tensorflow#authors) on the 
[sxapi-demo-openshift-tensorflow homepage](https://github.com/startxfr/sxapi-demo-openshift-tensorflow).
Usefull informations regarding the tensorflow deployement could be found on the [tensorflow-operator documentation](http://docs.tensorflow.com/prerelease/tensorflow-operator/beta/tensorflowClusterConfig.html)
