FROM node:lts
WORKDIR /app
COPY . /app
RUN yarn

CMD ["yarn", "test"]
