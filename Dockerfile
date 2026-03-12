FROM node:lts

ENV YARN_VERSION=4

WORKDIR /app
COPY . /app

RUN corepack enable && corepack prepare yarn@${YARN_VERSION}

RUN yarn set version berry

RUN yarn install --immutable

CMD ["yarn", "test"]
