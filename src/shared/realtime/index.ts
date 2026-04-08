import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initRealtime(server: any): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('joinMatch', (matchId: string) => {
      socket.join(`match:${matchId}`);
    });

    socket.on('leaveMatch', (matchId: string) => {
      socket.leave(`match:${matchId}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitBallAdded(matchId: string, data: {
  ball: any;
  innings: any;
  match: any;
}) {
  if (io) {
    io.to(`match:${matchId}`).emit('ball:added', data);
  }
}

export function emitBallRemoved(matchId: string, data: {
  innings: any;
  match: any;
}) {
  if (io) {
    io.to(`match:${matchId}`).emit('ball:removed', data);
  }
}

export function emitInningsEnd(matchId: string, data: {
  innings: any;
  match: any;
  reason: 'all_out' | 'target_reached' | 'overs_complete' | 'declared';
}) {
  if (io) {
    io.to(`match:${matchId}`).emit('innings:end', data);
  }
}

export function emitOverComplete(matchId: string, data: {
  overNumber: number;
  innings: any;
}) {
  if (io) {
    io.to(`match:${matchId}`).emit('over:end', data);
  }
}