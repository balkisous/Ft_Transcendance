import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { UserService } from 'src/user/user.service';
import { MessageService } from 'src/message/message.service';
import { ChannelService } from 'src/channel/channel.service';
import { AuthService } from 'src/auth/auth.service'
// import AuthService from "../services/authentication-service"

import { CreateMessageDto } from 'src/message/dto/create-message.dto';
import { CreateChannelDto } from 'src/channel/dto/create-channel.dto';
import { UpdateChannelDto } from 'src/channel/dto/update-channel.dto';
import { Puck } from 'src/game/puck';
import  Paddle  from 'src/game/paddle';
import { GameService } from 'src/game/game.service';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';


/*
interface pos {
    x: number,
    y: number,
}

type player = {
    id: string;
} & pos;

type puck = pos;

interface player2 extends pos {
    id: string
}

// interfaces generiques
interface coordinateTwo<T> {
    x: number,
    y: number,
    data: T,
}
const player: coordinateTwo<string> = {
  x: 20,
  y: 40,
  data: "hello world",
}
*/

@WebSocketGateway({ cors: true })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly messageService: MessageService, // Inject your MessageService here
    private readonly channelService: ChannelService,
    private readonly userService: UserService,
    // private readonly authService: AuthService,
  ) {}

  @WebSocketServer()
  server: Server;

  private users: any[] = [];
  private messages = {
    general: [],
    random: [],
    jokes: [],
    javascript: [],
  };

  async handleConnection(socket: Socket) {
    console.log('Socket connected:', socket.id);
    const users = await this.messageService.findAll();
  }

 async handleDisconnect(socket: Socket) {
  console.log('Socket disconnected:', socket.id);
  const userIndex = this.users.findIndex((u) => u.sockets.includes(socket.id));
  if (userIndex >= 0) {
    // Remove the socket id from the user's array of sockets
    this.users[userIndex].sockets = this.users[userIndex].sockets.filter((s) => s !== socket.id);
    console.log(`${this.users[userIndex].username}' just closed a tab: with socketid ${socket.id} `);

    // If the user has no more sockets, remove the user object from the users array
    if (this.users[userIndex].sockets.length === 0) {
      const disconnectedUser = this.users.splice(userIndex, 1)[0];
      console.log(`${disconnectedUser.username} (${disconnectedUser.id}) has disconnected`);
    }
  }
  this.server.emit('connected users', this.users);
}

@SubscribeMessage('all users')
async handleGetUsers(socket: Socket, userdata: {id: number, name: string}) {
  const currentuser = await this.userService.findOnebyId(userdata.id);
  const allusers = await this.userService.findAll();
console.log("SOCKET ALL USERS", currentuser.username)
  const payload = {
    currentuser,
    allusers,
  };
  this.server.to(socket.id).emit('all users', payload);

}

@SubscribeMessage('join server')
async handleJoinServer(socket: Socket, userdata: {id: number, name: string}) {
  console.log('join server');
  // socket.userid = userdata.id;
  // socket.username = userdata.name;
  const userIndex = this.users.findIndex((u) => u.id === userdata.id);
  if (userIndex >= 0) {
    // User already exists, add new socket to their existing array of sockets
    this.users[userIndex].sockets.push(socket.id);
    console.log(this.users[userIndex], 'just opened a new tab');
  } else {
    // User doesn't exist, create a new user object with a new array of sockets
    const user = {
      username: userdata.name,
      id: userdata.id,
      sockets: [socket.id],
    };
    this.users.push(user);
    console.log(user, 'just joined server');
  }
    
  // RETRIEVE AND LOAD ALL MESSAGES IN ALL ROOMS FOR THIS USER

  // const channels = await this.channelService.findAll();c
  console.log("userdata id and name", userdata.id, userdata.name)
  const channels = await this.channelService.getChannelsforUser(userdata.id); //petits bugs a checker quand deux users differents se log et refresh la page
//aussi a GET LES PUBLIC CHANS 
  if (channels) {
  // const channelNames2 = channels.map(channel => {
  //   if (channel.dm && channel.members.length == 2) {
  //     console.log("je passe au moins dans members ", channel.members)
  //     const otherMember = channel.members.find(member => member.username !== userdata.name);
  //     return otherMember.username;
  //   } else {
  //     return channel.name;
  //   }
  // });
  const channelNames = channels.map(channel => channel.name);

  
  console.log("CHANNELLNAMES ???", channelNames);
   this.server.to(socket.id).emit('all chans',channelNames);
   this.server.emit('connected users', this.users);
    for (const channel of channels) {
      const channelName = channel.name;
      const accessType = channel.accessType;
    // const user = await this.userService.findOnebyId(userdata.id);

      // const user = await this.userService.findOneByName(userdata.name);
      // const blockedUsers = user.blockedUsers;
      // const blockedUsers = user.getBlockedUsers();
      // const blockedUsers =  await this.userService.findBlockedUsers(userdata.id);
      //A TESTER


      const blockedUsers =  await this.userService.getBlockedUsers(userdata.id);
      const blockedusernames = blockedUsers?.map(user => user.username);
      const channelMessages = await this.channelService.findMessagesByChatname(channelName, blockedUsers);

      // const channelMessages = await this.channelService.findMessagesByChatname(channelName);
      // const channelMessages = await this.channelService.findMessagesByChatname(channelName, userdata.id);
      const members = channel.members?.map(user => user.username);
      const mutedMembers = channel.mutedMembers?.map(user => user.username);
      const admins = channel.admins?.map(user => user.username);
      const bannedmembers = channel.bannedUsers?.map(user => user.username);
      const owner = channel.owner.username;
      // console.log("owner SOCKET", owner)
      socket.join(channelName);
      if (!this.messages[channelName]) {
        this.messages[channelName] = []; // add new room if it doesn't exist
      }
      // console.log(
      //   socket.id,
      //   'just joined rooOOOOm',
      //   channelName, 'access type:',
      //   accessType,
      //   channelMessages,
      // );
      this.messages[channelName].push(...channelMessages);
      // console.log("members and admins AAAAAAARE", admins, members)
      // console.log("THIS MESSAGES AFTER!!!!!! for ", channelName, this.messages[channelName]);
       this.server.to(socket.id).emit('join room', { room: channelName, accessType: accessType, messages: channelMessages, members: members, admins: admins, bannedmembers: bannedmembers, mutedMembers:mutedMembers, owner: owner, blockedUsers: blockedusernames }); // send all messages for all rooms
      console.log("ALL USERS CHANS SOCKET")
       this.server.to(socket.id).emit("all user's chans", channels);
    }
  }
}


  @SubscribeMessage('create chan')
  async handleCreateNewChan(socket: Socket, datachan: any) {
    const { creator, roomName, accessType, password } = datachan;
    if (roomName == null) { // check if roomName is null or undefined
      socket.emit('error', 'Room name cannot be null or undefined.'); // emit an error message to the socket
      return;
    }
    console.log(`attempting (${roomName}) room (${accessType}) creation. password is (${password}) and creator is (${datachan.creator})`)
    const usr = await this.userService.findOnebyId(datachan.creator);
    const existingChannel = await this.channelService.findOneByName(roomName);
    if (!existingChannel) {
      console.log(`room (${roomName})  doesn't exist so let's create it`)
      const channelDto: CreateChannelDto = {
        name: roomName,
        owner: usr,
        accessType: accessType,
        password: password,
        members: [usr],
        admins: [usr],
        // invitedUsers: [usr],
      };

    const newChannel = await this.channelService.createChannel(channelDto);
     this.server.emit('new chan', this.channelService.findAll()); // broadcast to all connected sockets
    //  this.server.to(socket.id).emit('new chan', { channelName: roomName}); // broadcast to all connected sockets
    }
  }


  @SubscribeMessage('create DM')
  async handleCreateDM(socket: Socket, datachan: any) {
    const { username1, username2 } = datachan;
 
    console.log(`SOCKET CREATE DM with (${username1}) and (${username2})`)
    
    const newChannel = await this.channelService.createDm(username1, username2);

    // const newChannel = await this.channelService.createChannel(channelDto);
     this.server.emit('new chan', this.channelService.findAll()); // broadcast to all connected sockets
    }
  

@SubscribeMessage('remove chan')
async handleRemoveChannel(socket: Socket, channelName: string) {

  console.log('removing channel', channelName)
  const existingChannel = await this.channelService.findOneByName(channelName);
  if (existingChannel) {
  console.log('existing channel', existingChannel.name, existingChannel.id)

    // await Promise.all(existingChannel.messages.map(async (msg) => {
    //   await this.messageService.remove(msg.id);
    // }));
    
    // await this.messageService.remove(existingChannel.messages.map(msg => msg.id)); // remove all messages in the channel
    await this.channelService.remove(existingChannel.id);
    this.server.emit('new chan', this.channelService.findAll()); // broadcast to all connected sockets

    // this.server.emit('chan removed', channelName); // broadcast to all connected sockets
  } else {
    socket.emit('error', `Channel ${channelName} does not exist.`);
  }
}

@SubscribeMessage('change password')
async handleChatPassword(socket: Socket, data: any) {
  const { userId, channelName, newPassword } = data;
  const updateChannelDto: UpdateChannelDto = {password: newPassword, name: channelName };

 await this.channelService.changeChannelPassword(userId, updateChannelDto);
 this.server.emit('new chan', this.channelService.findAll()); // broadcast to all connected sockets

}

@SubscribeMessage('remove password')
async handleRemoveChatPassword(socket: Socket, data: any) {

const { userId, channelName } = data;

await this.channelService.removeChannelPassword(userId, channelName);
this.server.emit('new chan', this.channelService.findAll()); // broadcast to all connected sockets

}


@SubscribeMessage('check password')
async handlecheckChatPassword(socket: Socket, data: any) {
  const { userId, channelName, userInput } = data;
  // const updateChannelDto: UpdateChannelDto = { password: newPassword, name: channelName };

  const bool = await this.channelService.isChannelPasswordCorrect(channelName, userInput);
  console.log("channel pass is correct or not : ", bool);
  this.server.to(socket.id).emit('is userinput correct', bool);


}

@SubscribeMessage('add member')
async handleAddMember(socket: Socket, payload: any) {
  const { channelName, AdminId, username } = payload;

    console.log(channelName, AdminId, username)
  const chan = await this.channelService.findOneByName(channelName);
  const bool = await this.channelService.addMember(channelName, AdminId, username);
  // const { memberadded: bool, username: username } = payload;
  this.server.emit("member adding", {memberadded: bool, username: username})
  this.server.emit('new chan', this.channelService.findAll()); // broadcast to all connected sockets

}


@SubscribeMessage('add admin')
async handleAddAdmin(socket: Socket, payload: any) {
  const { channelName, AdminId, username } = payload;
    console.log(channelName, AdminId, username)
  const chan = await this.channelService.findOneByName(channelName);
  await this.channelService.addAdmin(channelName, AdminId, username);
 this.server.emit('new chan', this.channelService.findAll()); // broadcast to all connected sockets

}

@SubscribeMessage('remove admin')
async handleRemovAdmin(socket: Socket, payload: any) {
  const { channelName, AdminId, username } = payload;

    console.log(channelName, AdminId, username)
  const chan = await this.channelService.findOneByName(channelName);
  await this.channelService.removeAdmin(channelName, AdminId, username);
 this.server.emit('new chan', this.channelService.findAll()); // broadcast to all connected sockets

}


@SubscribeMessage('remove member')
async handleRemoveMember(socket: Socket, payload: any) {
  console.log("socket remove member")
  const { channelName, AdminId, username } = payload;

    console.log(channelName, AdminId, username)
  const chan = await this.channelService.findOneByName(channelName);
  await this.channelService.removeMember(channelName, AdminId, username);
  this.server.emit('new chan', this.channelService.findAll()); // broadcast to all connected sockets

}

@SubscribeMessage('block user')
async handleBlockUser(socket: Socket, payload: any) {
  console.log("socket block user")
  const { UserWhoCantAnymore, usernameToBlock } = payload;

    console.log(UserWhoCantAnymore, usernameToBlock)
  await this.userService.blockUser(UserWhoCantAnymore, usernameToBlock);
}

@SubscribeMessage('unblock user')
async handleUnblockUser(socket: Socket, payload: any) {
  console.log("socket unblock user")
  const { UserWhoCantAnymore, usernameToBlock } = payload;

    console.log(UserWhoCantAnymore, usernameToBlock)
  await this.userService.unblockUser(UserWhoCantAnymore, usernameToBlock);
}



@SubscribeMessage('ban member')
async handleBanMember(socket: Socket, payload: any) {
  console.log("socket remove member")
  const { channelName, AdminId, username } = payload;

    console.log(channelName, AdminId, username)
  const chan = await this.channelService.findOneByName(channelName);
  await this.channelService.banMember(channelName, AdminId, username);
  this.server.emit('new chan', this.channelService.findAll()); // broadcast to all connected sockets

}

@SubscribeMessage('mute member')
async handleMuteMember(socket: Socket, payload: any) {
  console.log("socket mute member")
  const { channelName, AdminId, username } = payload;

    console.log(channelName, AdminId, username)
  const chan = await this.channelService.findOneByName(channelName);
  await this.channelService.muteMember(channelName, AdminId, username);
}

  @SubscribeMessage('join room')
  async handleJoinRoom(socket: Socket, roomName: string) {
    //cote client mettre si bon mdp then ok call this function
    //await add to user this roomname (roomid plutot)
    socket.join(roomName);
    if (!this.messages[roomName]) {
      this.messages[roomName] = []; // add new room if it doesn't exist
    }
    // console.log(
    //   socket.id,
    //   'just joined room',
    //   roomName,
    //   this.messages[roomName],
    // );
    socket.emit('join room', this.messages[roomName]);
  }

  @SubscribeMessage('send message')
  async handleMessage(socket: Socket, data: any) { // Make this function async to allow database calls
    if (data) {
      const { content, to, sender, senderid, chatName, isChannel } = data;
    
    console.log(socket.id, "just sent a message", data)
      const payload = {
        content,
        chatName,
        sender: data.sender,
      };
    // Save the message to the database
    const channel = await this.channelService.findOneByName(to);
    // const userchans = this.userService.getChannels();  //plutot enregistrer dans le user chan pour eviter doublons ou bien par chanid
    const senderr = await this.userService.findOnebyId(senderid);
    //TO DO BEFORE: A ADD DANS LE USER APRES CREATION ET CHECK DANS CHANNEL DATABASE
    if (channel) {
      const messageDto: CreateMessageDto = {
        content,
        sender: senderr,
        channel,
      };
      await this.messageService.create(messageDto);
    }
    if (this.messages[chatName]) {
      this.messages[chatName].push({
        sender: data.sender,
        content,
      });
    }
const excludedSocketIds = [];

for (const user of this.users) {
  const blockedUsers = await this.userService.getBlockedUsers(user.id);
  const excludedUserIds = blockedUsers.map(user => user.id);

  if (excludedUserIds.includes(senderid)) {
    excludedSocketIds.push(...user.sockets);
  }
}
// this.server.to(to).except(excludedSocketIds).emit('new message', payload);
      socket.to(to).except(excludedSocketIds).emit('new message', payload);

  }
  }
  
  /////////////// GAME SIDE ///////////////

  room: string;
  isGameStart = false;
  width: number;
  height: number;
  puck: Puck;
  paddle_left : Paddle;
  paddle_right : Paddle;
  fscore = 5;


    // join game from home page
@SubscribeMessage("join_game")
  public async joinGame( 
        socket: Socket,
        data : any) 
    {
      const {message, userid, username} = data;
      console.log("user id is ", userid, " username", username);
      console.log("room message id: ", message);
      this.room = message;
      const connectedSockets = this.server.sockets.adapter.rooms.get(message);
      //this.server.emit('game');

      const socketRooms = Array.from(socket.rooms.values()).filter((r) => r !== socket.id);
      if ( socketRooms.length > 0 || (connectedSockets && connectedSockets.size === 2))
      {
        socket.emit("room_join_error", {
          error: "Room is full please choose another room to play! you gonna be a spectator",
        });
      } else {
        await socket.join(message);
        this.server.emit("room_joined");
        console.log("ici in size == 2")
        
        if (this.server.sockets.adapter.rooms.get(message).size === 2) 
        { // si on a deux user start game 
          this.server.to(message).emit("start_game", {});
          // ici envoyer au front end change page in homegame et lancer le jeu
        }
      }
    }
        
        // start game from pong.txt 
        @SubscribeMessage('start game')
        async handleJoinGameServer(socket: Socket, gamedata : any) {
          
          console.log('launch ball, ', this.room);
          this.width = gamedata.width;
          this.height = gamedata.height;
          console.log('width and height in backend haha ', this.width, this.height)
          this.puck = new Puck(this.width, this.height);
          if (!this.paddle_left)
            this.paddle_left = new Paddle(this.width, this.height, true, false, gamedata.id, gamedata.name)
          else
            this.paddle_right = new Paddle(this.width, this.height, false, false, gamedata.id, gamedata.name)
          console.log("deux users pour launch ball, puck instancier ");
          await socket.join(this.room);
          if (this.server.sockets.adapter.rooms.get(this.room).size === 2) 
          { // si on a deux user start game 
            this.isGameStart = true;
            console.log("game start true");
            this.updateBall(socket);
            //this.server.to(room).emit("launch ball", {}); // ici envoyer au front end change page in homegame et lancer le jeu
          }
          else
            console.log("no game started, size ", this.server.sockets.adapter.rooms.get(this.room).size)
          //this.server.emit('update ball');
        }
  

        @SubscribeMessage('KeyReleased')
        async KeyRealaesed(socket: Socket) {
          this.paddle_left.move(0);
          this.paddle_right.move(0);
        }

        @SubscribeMessage('KeyPressed')
        async KeyPressedr(socket: Socket, gamedata : any) { 
          if (gamedata.name == this.paddle_left.name)
          {
            if (gamedata.key == 'j')
            {
              this.paddle_left.move(-10);
            }
            if (gamedata.key == 'n')
            {
              this.paddle_left.move(10);
            }
          }
          else if (gamedata.name == this.paddle_right.name)
          {
            if (gamedata.key == 'j')
            {
              console.log("back keyPressed up ", gamedata.name)
                this.paddle_right.move(-10);
            }
            else if (gamedata.key == 'n')
            {
              console.log("back keyPressed down ", gamedata.name)
                this.paddle_right.move(10);
          }
          }
        }

        async addscore() {
          console.log("PASSE PAR ADD SCORE BACK")
          const luser = await this.userService.findOnebyId(this.paddle_left.id)
          const ruser = await this.userService.findOnebyId(this.paddle_right.id)
          const lwin = luser.wins;
          const rlose = ruser.losses;
          const llose = luser.losses;
          const rwin = ruser.wins;
          if (this.puck.left_score = this.fscore)
          {              
            luser.wins += 1;
            ruser.losses += 1;
            // const llose = luser.losses;
            // const rwin = ruser.wins;
            // const luserdto:  UpdateUserDto = {
            //   wins: lwin
            // };
            // const ruserdto:  UpdateUserDto = {
            //   losses: rlose
            // }
           
          }
          else if (this.puck.right_score = this.fscore)
          { luser.losses += 1;
            ruser.wins += 1;
            // const rlose = ruser.losses;
            // const lwin = luser.wins;
            // const luserdto:  UpdateUserDto = {
              //   losses: llose
              // };
              // const ruserdto:  UpdateUserDto = {
                //   wins: rwin
                // }
              }
              await this.userService.update(this.paddle_left.id, luser);
              await this.userService.update(this.paddle_right.id, ruser);


            // await this.userService.updateByName(this.paddle_left.name, lwin, llose)
            // await this.userService.updateByName(this.paddle_right.name, rwin, rlose)
            // await this.userService.updateByName(this.paddle_left.name, lwin, llose)
            // await this.userService.updateByName(this.paddle_right.name, rwin, rlose)
          
        }

        // function helper to game position
    updateBall(socket: Socket) {
      //console.log("do something, I am a loop, in 1000 miliseconds, ill be run again");
      if (!this.isGameStart || this.puck.left_score == this.fscore || this.puck.right_score == this.fscore) {
        this.addscore();
        return;
      } else {
        if (this.puck) { // Check if this.puck is defined
          this.puck.update();
          this.puck.edges();
          this.puck.checkPaddleLeft(this.paddle_left, false, 0);
          this.puck.checkPaddleRight(this.paddle_right, false, 0);
          const payload = {x : this.puck.x, y : this.puck.y, lscore: this.puck.left_score, rscore: this.puck.right_score}
          if (this.paddle_left && this.paddle_right)
          {
            this.paddle_left.update();
            this.paddle_right.update()
            const payloadp = {prx: this.paddle_right.x, pry: this.paddle_right.y, prw: this.paddle_right.w, prh: this.paddle_right.h, pln: this.paddle_left.name, plx: this.paddle_left.x, ply: this.paddle_left.y, plw: this.paddle_left.w, plh: this.paddle_left.h, prn: this.paddle_right.name}
            this.server.to(this.room).emit("paddle update", (payloadp));
          };
          //console.log("data of my puck, x and y: ", this.puck.getx(), this.puck.gety());
          //this.server.to(this.room).emit("puck_update", {});
          this.server.to(this.room).emit("puck update", (payload));
        }
        setTimeout(this.updateBall.bind(this, socket), 30); // Bind the `this` context to the function
      }
    }

}
