FROM node:lts

ENV YARN_VERSION=4

RUN corepack enable && corepack prepare yarn@${YARN_VERSION}

WORKDIR /app
COPY . /app
RUN yarn

CMD ["yarn", "test"]
