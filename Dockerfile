FROM node:18-alpine

WORKDIR /app

# Install Claude Code
RUN npm install -g @anthropic-ai/claude-code

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]