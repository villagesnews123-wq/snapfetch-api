FROM node:20-alpine

# Install Python and required tools
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    bash \
    curl

WORKDIR /app

# Prevent youtube-dl-exec from downloading binaries during npm install
ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]