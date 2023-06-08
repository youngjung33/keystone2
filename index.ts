const express = require('express');
const cors = require("cors")
const { config, list } = require('@keystone-6/core');
const { text } = require('@keystone-6/core/fields');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const {allowAll} = require('@keystone-6/core/access');
const {WebSocketServer} = require('ws');

const databaseUrl = process.env.DATABASE_URL || '';

const keystone = config({

  db: {
    provider: 'sqlite',
    url: databaseUrl,
  },
  lists: {
    User: list({
        access: {
            operation:{
            query: allowAll,
            create: allowAll,
            update: allowAll,
            delete: allowAll,
            }
        },
    }),
  },
});

const port = process.env.PORT || 4000;
const app = express();
app.use(cors());
app.use(express.json());

const httpServer = app.listen(port, () => {
  console.log('Express 앱이 4000번 포트에서 실행 중입니다.');
});

const wss = new WebSocketServer({
  server:httpServer,
  path:'/websocket',
});
wss.on('connection', (ws) => {
  console.log('새로운 클라이언트가 연결되었습니다.');
  ws.on('message', (message) => {
    console.log('클라이언트로부터 메시지를 수신했습니다:', message);

    // 클라이언트에게 응답 메시지를 보내는 예시
    ws.send('서버가 메시지를 받았습니다.');
  });

  // 클라이언트와의 연결이 끊겼을 때 이벤트 처리
  ws.on('close', () => {
    console.log('클라이언트와의 연결이 종료되었습니다.');
  });
});


app.get('/users', async (req, res) => {
  const context = {
    db: {
      User: keystone.lists.User,
    },
    prisma: new PrismaClient(),
  };

  try {
    await context.prisma.$connect();
    const users = await context.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        company: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await context.prisma.$disconnect();
  }
});


