## AWS fu

install AWS tools for Elastic Beanstalk

```
pip install --upgrade awsebcli
```

## eb setup commands

```
eb init
eb deploy
eb ssh    # ssh to EC2 instance
```

## docker commands (from ec2 instance)

```
docker ps       # list all running docker containers
docker ps -lq   # show ID of latest container

ID=$(sudo docker ps -lq)
sudo docker logs $ID                 # view app log
sudo docker exec -it $ID /bin/bash   # interactive shell on container
```



## eb command line

```
eb logs   # gets ALL the logs
eb open   # opens current app in a browser
```

## TODO

* Dockerfile.aws for this setup, resurrect the original for local development
* see if we can get ./tools/ebexec.sh to work

## Questions

* We have the ElasticBeanstalk configuration checked in [.elasticbeanstalk/config.yml](.elasticbeanstalk/config.yml)
-- is that a good idea?

