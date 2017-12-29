FROM node:carbon


RUN apt-get update && \
  apt-get install -y postgresql-client graphicsmagick

ENV DATABASE_URL postgresql://$RDS_USERNAME:$RDS_PASSWORD@$RDS_HOSTNAME:$RDS_PORT/midas

# if we run npm install as root, it causes a warning
# so we set up a user and group for the app
ENV USER openopps
ENV GROUP openopps
ENV HOME /home/$USER
RUN groupadd -r $GROUP
RUN useradd -g $GROUP --create-home --home-dir $HOME $USER \
    && mkdir -p $HOME/app

WORKDIR $HOME/app

# Bundle app source
COPY . .

# copy this tool to the root, used by docker-compose for dev docker instance
COPY tools/docker/wait-for-migrate-db-container.sh ./

# copy ignores USER directive, so fixup file ownership:
RUN chown -R $USER:$GROUP $HOME/app

USER $USER
RUN npm install

EXPOSE 3000
CMD [ "npm", "start" ]

