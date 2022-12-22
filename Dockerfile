FROM jrottenberg/ffmpeg:3.3-alpine
FROM node:alpine

COPY --from=0 / /

RUN mkdir /home/node/app
WORKDIR /home/node/app
COPY ./api /home/node/app
RUN npm install --legacy-peer-deps
RUN npm run build
ARG NODE_ENV
ENV NODE_ENV $NODE_ENV
CMD [ "npm", "run", "start"]
EXPOSE 8080

