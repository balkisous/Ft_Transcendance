import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { Message } from 'src/message/entities/message.entity';
// import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ChannelService {
  static findAll() {
    throw new Error("Method not implemented.");
}
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    private readonly userService: UserService,
    // private readonly channelService: ChannelService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
 ) {}

  async create(createChannelDto: CreateChannelDto) {
    const channel = this.channelRepository.create(createChannelDto);
    return this.channelRepository.save(channel);
  }

  async createChannel(createChannelDto: CreateChannelDto): Promise<Channel> {
    const channel = this.channelRepository.create(createChannelDto);
    return this.channelRepository.save(channel);
  }
  
  //si valeur n'existe pas dans l'entity et appel a  sur leftJoinAndSelect('channel.admins', 'admin') va mettre ce message d'erreur [Nest] 24976  - 04/24/2023, 9:41:03 PM   ERROR [WsExceptionsHandler] Relation with property path invitedUsers in entity was not found.
  async findAll() {
    const channels = await this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.owner', 'owner')
      .leftJoinAndSelect('channel.members', 'member')
      .leftJoinAndSelect('channel.bannedUsers', 'bannedUser')
      .leftJoinAndSelect('channel.mutedMembers', 'mutedMember')
      // .leftJoinAndSelect('channel.invitedUsers', 'invitedUser')
      .leftJoinAndSelect('channel.admins', 'admin')
      // .select(['channel.name', 'channel.id', 'member.username', 'admin.username'])
      .leftJoinAndSelect('channel.messages', 'message')
      .select(['channel.name', 'channel.dm', 'channel.id', 'channel.accessType', 'owner.username', 'channel.password', 'member.username', 'member.id', 'admin.username', 'bannedUser.username', 'mutedMember.username',  'message.content'])
      // .select(['channel.name', 'channel.dm', 'channel.password', 'message.content', 'member.username', 'invitedUser.username', 'admin.username'])
      .getMany();
    return channels;
  }
  
  async findOne(id: number): Promise<Channel | undefined> {
    if (isNaN(id)) {
      return undefined; 
    }
    const channel = await this.channelRepository
      .createQueryBuilder('channel')
      .where('channel.id = :id', { id })
      .leftJoinAndSelect('channel.members', 'members')
      .leftJoinAndSelect('channel.bannedUsers', 'bannedUsers')
      .leftJoinAndSelect('channel.admins', 'admins')
      .leftJoinAndSelect('channel.mutedMembers', 'mutedMembers')
      .leftJoinAndSelect('channel.owner', 'owner')
      .select(['channel.id', 'channel.name', 'members.username', 'bannedUsers.username', 'admins.username', 'mutedMembers.username', 'owner.username'])
      .getOne();
    return channel;
  }

  // async findOneByName(name: string): Promise<Channel | undefined> {
  //   const channel = await this.channelRepository
  //     .createQueryBuilder('channel')
  //     .leftJoinAndSelect('channel.members', 'members')
  //     .where('channel.name = :name', { name })
  //     .leftJoinAndSelect('channel.admins', 'admins')
  //     .select(['channel.id', 'channel.name', 'members', 'admins'])
  //     .getOne();
  
  //   return channel;
  // }

  /*check pour owner admins and mutedMembers bannedUsers */
  async findOneByName(name: string): Promise<Channel | undefined> {
    const channel = await this.channelRepository
      .createQueryBuilder('channel')
      .where('channel.name = :name', { name })
      .leftJoinAndSelect('channel.members', 'members')
      .leftJoinAndSelect('channel.bannedUsers', 'bannedUsers')
      .leftJoinAndSelect('channel.admins', 'admins')
      .leftJoinAndSelect('channel.mutedMembers', 'mutedMembers')
      .leftJoinAndSelect('channel.owner', 'owner')
      .select(['channel.id', 'channel.name', 'members', 'bannedUsers', 'admins', 'mutedMembers', 'owner'])
      .getOne();
  
    return channel;
  }
  
  

  // async isUserMuted(channelName: string, user: User): Promise<boolean> {
  //   const channel = await this.findOneByName(channelName);
  //   if (!channel) {
  //     return false;
  //   }
  //   return channel.mutedMembers.some(mutedMember => mutedMember.id === user.id);
  // }
  

  // async isUserMuted(channelName: string, user: User): Promise<boolean> {
  //   // const channel = await this.findOneByName(channelName);
  //   const channel = await this.channelRepository.findOne({ where: { name: channelName }, relations: ['mutedMembers'] });
  //   if (!channel) {
  //     throw new Error(`Channel ${channelName} not found`);
  //   }
  
  //   const now = new Date();
  //   for (const mutedMember of channel.mutedMembers) {
  //     if (mutedMember.user.id === user.id && mutedMember.mutedUntil > now) {
  //       // code here
  //       //return true
  //     }
      
  //   }
  
  //   return false;
  // }


  
  
  async isUserBanned(channelName: string, user: User): Promise<boolean> {
    const channel = await this.findOneByName(channelName);
    if (!channel) {
      return false;
    }
    return channel.bannedUsers.some(banneduser => banneduser.id === user.id);
  }


  async isUserAdmin(channelName: string, user: User): Promise<boolean> {
    const channel = await this.findOneByName(channelName);
    if (!channel) {
      return false;
    }
    return channel.admins.some(admin => admin.id === user.id);
  }


  async isUserOwner(channelName: string, user: User): Promise<boolean> {
    const channel = await this.findOneByName(channelName);
    if (!channel || !channel.owner) {
      return false;
    }
    return channel.owner.id === user.id;
  }
  // //Cannot query across many-to-many for property users
  // async findOneByName(name: string): Promise<Channel | undefined> {
  //   const channel = await this.channelRepository
  //     .createQueryBuilder('channel')
  //     .leftJoinAndSelect('channel.members', 'members')
  //     .where('channel.name = :name', { name })
  //     // .leftJoinAndSelect('channel.id', 'id')
  //     // .select(['channel.name', 'members.username'])
  //     .select(['channel.id', 'channel.name', 'members.username'])
  //     .getOne();
  //     // .getMany();
  
  //   return channel;
  // }
  
async isChanPublic(channelName: string): Promise<boolean> {
  const channel = await this.channelRepository.createQueryBuilder('channel')
    .where('channel.name = :channelName', { channelName })
    .andWhere('channel.password IS NULL') // exclude password-protected channels
    .getOne();

  return !!channel && !channel.dm;
}


async isChanPasswordProtected(channelName: string): Promise<boolean> {
  const channel = await this.channelRepository
    .createQueryBuilder('channel')
    .where('channel.name = :name', { name: channelName })
    .andWhere('channel.password IS NOT NULL')
    .select('channel.id')
    .getOne();

  return !!channel;
}

async isChanPrivate(channelName: string): Promise<boolean> {
  const channel = await this.channelRepository
    .createQueryBuilder('channel')
    .where('channel.name = :name', { name: channelName })
    .andWhere('channel.dm = true') // include DMs
    .leftJoinAndSelect('channel.members', 'members')
    .select(['channel.id', 'channel.name', 'members'])
    .getOne();

  return !!channel && channel.members.length > 0;
}


 
  
//OK
  // async findMessagesByChatname(chatname: string): Promise<{ content: string, chatName: string, sender: string }[]> {
  //   const messages = await this.messageRepository
  //     .createQueryBuilder('message')
  //     .leftJoin('message.channel', 'channel')
  //     .leftJoin('message.sender', 'sender')
  //     .select(['message.content', 'channel.name', 'sender.username'])
  //     .where('channel.name = :chatname', { chatname })
  //     .getMany();
  
  //   return messages.map(message => {
  //     const { content, channel } = message;
  //     const sender = message.sender ? message.sender.username : null;
  //     //filter sender here        if (blockedUsers.some(user => user.id === message.sender?.id)
  //     return {
  //       content,
  //       chatName: channel.name,
  //       sender,
  //     };
  //   });
  // }

  //Messages from NON BLOCKED USERS
  // async findMessagesByChatname(chatname: string, senderId: number): Promise<{ content: string, chatName: string, sender: string }[]> {
  //   const messages = await this.messageRepository
  //   .createQueryBuilder('message')
  //   .leftJoin('message.channel', 'channel')
  //   .leftJoin('message.sender', 'sender')
  //   .leftJoin('channel.bannedUsers', 'blockedUser', 'blockedUser.id = :senderId', { senderId })
  //   .select(['message.content', 'channel.name', 'sender.username'])
  //   .where('channel.name = :chatname', { chatname })
  //   .andWhere('blockedUser.id IS NULL')
  //   .getMany();
    
  //   return messages.map(message => {
  //     const { content, channel } = message;
  //     const sender = message.sender ? message.sender.username : null;
  //     return {
  //       content,
  //       chatName: channel.name,
  //       sender,
  //     };
  //   });
  //   }
  //Messsages from NON BLOCKED USERS <= a tester
  async findMessagesByChatname(chatname: string, blockedUsers: User[]): Promise<{ content: string, chatName: string, sender: string }[]> {
    const messages = await this.messageRepository
    .createQueryBuilder('message')
    .leftJoin('message.channel', 'channel')
    .leftJoin('message.sender', 'sender')
    .select(['message.content', 'channel.name', 'sender.username', 'sender.id'])
    .where('channel.name = :chatname', { chatname })
    .getMany();
  
  return messages
    .filter(message => !blockedUsers.some(user => user.id === message.sender?.id))
    .map(message => {
      const { content, channel } = message;
      const sender = message.sender ? message.sender.username : null;
      return {
        content,
        chatName: channel.name,
        sender,
      };
    });
  }

  async findAdmins(channel: Channel): Promise<User[]> {
    const admins = await this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.admins', 'admin')
      .where('channel.id = :channelId', { channelId: channel.id })
      .getOneOrFail();
  
    return admins.admins;
  }
  
  async findMembers(channel: Channel): Promise<User[]> {
    const members = await this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.members', 'member')
      .where('channel.id = :channelId', { channelId: channel.id })
      .getOneOrFail();
  
    return members.members;
  }
  
async update(id: number, updateChannelDto: UpdateChannelDto): Promise<Channel> {
  const channel = await this.channelRepository.findOne({ where: { id } });
  if (!channel) {
    throw new Error(`Channel with ID ${id} not found`);
  }
  
  Object.assign(channel, updateChannelDto);
  return this.channelRepository.save(channel);
}

async getChannelPassword(name: string) : Promise<string>{ 
  console.log("channel name", name);
  const channel = await this.channelRepository.createQueryBuilder('channel')
    .select('channel.password')
    .where('channel.name = :name', { name })
    .getOne();

  return channel ? channel.password : null;
}

async isChannelPasswordCorrect(channelName: string, userInput: string): Promise<boolean> {
  const channelPassword = await this.getChannelPassword(channelName);
  console.log("userinput is ", userInput);
  return channelPassword === userInput;
} //if returns bool=true then addMember function is called. <= do so in socket.ts


async getPublicChannels(): Promise<Channel[]> {
  const channels = await this.channelRepository.createQueryBuilder('channel')
    .where('channel.dm = false') // exclude DMs
    // .andWhere('channel.password IS NULL') // exclude password-protected channels
    .leftJoinAndSelect('channel.members', 'members')
    .select(['channel.id', 'channel.name', 'members'])
    .getMany();

  return channels;
}


async getPublicProtected(): Promise<Channel[]> {
  const channels = await this.channelRepository.createQueryBuilder('channel')
    .leftJoinAndSelect('channel.owner', 'owner')
    .leftJoinAndSelect('channel.members', 'member')
    .leftJoinAndSelect('channel.bannedUsers', 'bannedUser')
    .leftJoinAndSelect('channel.mutedMembers', 'mutedMember')
    .leftJoinAndSelect('channel.admins', 'admin')
    .leftJoinAndSelect('channel.messages', 'message')
    .select([
      'channel.name',
      'channel.dm',
      'channel.id',
      'channel.accessType',
      'owner.username',
      'channel.password',
      'member.username',
      'admin.username',
      'bannedUser.username',
      'mutedMember.username',
      'message.content'
    ])
    .where('channel.accessType IN (:...accessTypes)', { accessTypes: ['protected', 'public'] })
    .getMany();

  return channels;
}


async getPrivateChannelsforUser(userId: number): Promise<Channel[]> {
  const allChannels = await this.findAll();

  const userChannels = allChannels.filter(channel =>
    channel.accessType === 'private' && channel.members.find(member => member.id === userId)
  );

  return userChannels;
}


async getPublicAndProtectedChannelsForUser(userId: number): Promise<Channel[]> {
  const allChannels = await this.findAll();

  const userChannels = allChannels.filter(channel =>
    channel.accessType !== 'private');

  return userChannels;
}

async getChannelsforUser(userId: number): Promise<Channel[]> {
  const allChannels = await this.findAll();

  const privateChannels = allChannels.filter(channel =>
    channel.accessType === 'private' && channel.members.find(member => member.id === userId)
  );

  const publicAndProtectedChannels = allChannels.filter(channel =>
    channel.accessType !== 'private'
  );

  const userChannels = [...privateChannels, ...publicAndProtectedChannels];

  return userChannels;
}



async removeChannelPassword(userId: string, channelName: string): Promise<boolean> {
  // Check if user is the owner of the channel
  const channel = await this.channelRepository.createQueryBuilder('channel')
    .leftJoin('channel.owner', 'owner')
    .where('channel.name = :name', { name: channelName })
    .andWhere('owner.id = :userId', { userId })
    .getOne();

  if (!channel) {
    throw new Error('Channel not found or user is not the owner');
  }

  await this.channelRepository.update(channel.id, {
    password: null,
    accessType: 'public',
  });

  return true;
}


async changeChannelPassword(userId: string, updateChannelDto: UpdateChannelDto): Promise<boolean> {
  // Check if user is the owner of the channel
  const channel = await this.channelRepository.createQueryBuilder('channel')
    .leftJoin('channel.owner', 'owner')
    .where('channel.name = :name', { name: updateChannelDto.name })
    .andWhere('owner.id = :userId', { userId })
    .getOne();

  if (!channel) {
    throw new Error('Channel not found or user is not the owner');
  }

  await this.channelRepository.update(channel.id, {
    password: updateChannelDto.password,
    accessType: 'protected',
  });

  return true;
}

async addMember(channelName: string, adminId: number, username: string) : Promise<boolean> 
{
  const channel = await this.findOneByName(channelName);
  if (!channel)
    return false;
  // const admin = await this.userService.findOnebyId(adminId);

  // // Check if the admin is in the channel's list of admins
  // const isAdminInAdminsList = channel?.admins?.some(admin => admin.id === adminId);

  // if (!isAdminInAdminsList){
  //   throw new Error("Only admins are authorized to add members to the channel.");
  // }

  const user = await this.userService.findOneByName(username);
  if (!user)
    return false;

  if(!channel.members) {
    channel.members = []
  }
  channel.members.push(user)
  await this.channelRepository.save(channel);
  return true;
  }




  async addAdmin(channelName: string, adminId: number, username: string) : Promise<Channel | undefined> 
{
   // Check if user is the owner of the channel
//   const channel = await this.channelRepository.createQueryBuilder('channel')
//   .leftJoin('channel.owner', 'owner')
//   .where('channel.id = :channelId', { channelId })
//   .andWhere('owner.id = :userId', { userId })
//   .getOne();
  
//   if (!channel) {
//   throw new Error('Channel not found or user is not the owner');
//   }
  const channel = await this.findOneByName(channelName);
  // const admin = await this.userService.findOnebyId(adminId); //byname(username)

  // // Check if the admin is in the channel's list of admins
  // const isAdminInAdminsList = channel?.admins?.some(admin => admin.id === adminId);

  // if (!isAdminInAdminsList){
  //   throw new Error("Only admins are authorized to add members to the channel.");
  // }


//   // Add the admin to the channel's admin list
  const user = await this.userService.findOneByName(username);

  if(!channel.admins) {
    channel.admins = []
  }
  channel.admins.push(user)
  const result = await this.channelRepository.save(channel);
    return result;

    
  }

  // async removeFriend(user_id: number, friend_id: number) {
  //   const user = await this.userRepository.findOne({
  //     where: { id: user_id },
  //     relations: ['friends'],
  //   });
  //   console.log("USER", user)
  //   if(user.friends) {
  //     for (var k = 0; k < user.friends.length; k++)
  //     {
  //       if (user.friends[k].id === friend_id)
  //         user.friends.splice(k, 1)
  //     }
  //     await this.userRepository.save(user);
  //   }
  //   return;
  // }

// async removeAdmin(channel: Channel, userId: number) {
  async removeAdmin(channelName: string, adminId: number, username: string){
  const channel = await this.findOneByName(channelName);

  // const isAdmin = channel.admins.some(admin => admin.id === userId);
  const isOwner = channel.owner.id === adminId;

  // if (!isAdmin) {
  //   throw new Error('User is not an admin');
  // }

  // const user = await this.userService.findOnebyId(userId);
  if(channel.admins) {
    for (var k = 0; k < channel.admins.length; k++)
    {
      if (channel.admins[k].username === username)
      channel.admins.splice(k, 1)
    }
    await this.channelRepository.save(channel);
  }
  // const filteredAdmins = channel.admins.filter(admin => admin.username !== username);
  // const channel = await this.findOneByName(channelName);
  // const isOwner = channel.owner.id === adminId;
  // let newOwner;
  // if (isOwner) {
  //   if (channel.admins.length === 0) {
  //     // If the owner is the only admin, make the first member the new owner
  //     newOwner = channel.members[0];
  //   } else {
  //     // Otherwise, the first remaining admin becomes the new owner
  //     newOwner = channel.admins[0];
  //   }
  // }

  // await this.channelRepository.update(channel.id, {
  //   owner: newOwner
  // });
  // await this.channelRepository.update(channel.id, {
  //   admins: filteredAdmins,
    // owner: isOwner ? newOwner : channel.owner,
    // members: channel.members.filter(member => member.id !== userId),
  // });

  // return user;
}

async removeMember(channelName: string, adminId: number, username: string){

  console.log("REMOVE MEMBER CALLED SERVICE ADMINDID IS", adminId)
  const channel = await this.findOneByName(channelName);
  const isOwner = channel.owner.id === adminId;

  if(channel.members) {
    for (var k = 0; k < channel.members.length; k++)
    {
      if (channel.members[k].username === username)
      channel.members.splice(k, 1)
    }
    await this.channelRepository.save(channel);
  }

  if(channel.admins) {
    for (var k = 0; k < channel.admins.length; k++)
    {
      if (channel.admins[k].username === username)
      channel.admins.splice(k, 1)
    }
    await this.channelRepository.save(channel);
  }
  if ((channel.admins.length === 0) && (channel.members.length === 0) )
    return;
  // const channel = await this.findOneByName(channelName);
  let newOwner;
  if (isOwner) {
  console.log("TRYING TO KICK OWNER")

    if (channel.admins.length === 0) {
  console.log("NO ADMIN SO CHOOSING A MEMBER AS NEW OWNER")

      // If the owner is the only admin, make the first member the new owner
      newOwner = channel.members[0];
    } else {
  console.log("THERE IS AN ADMIN SO CHOOSING AN ADMIN AS NEW OWNER")

      // Otherwise, the first remaining admin becomes the new owner
      newOwner = channel.admins[0];
    }

  await this.channelRepository.update(channel.id, {
    owner: newOwner
  });
}

  // await this.channelRepository.update(channel.id, {
  //   password: updateChannelDto.password,
  // });
}

async banMember(channelName: string, adminId: number, username: string){

  console.log("BAN MEMBER CALLED SERVICE")
  const channel = await this.findOneByName(channelName);

  // if(channel.members) {
  //   for (var k = 0; k < channel.members.length; k++)
  //   {
  //     if (channel.members[k].username === username)
  //     channel.members.splice(k, 1)
  //   }
  //   await this.channelRepository.save(channel);
  // }

  const user = await this.userService.findOneByName(username);
 
  if(!channel.bannedUsers) {
    channel.bannedUsers = []
  }
  channel.bannedUsers.push(user)
  const result = await this.channelRepository.save(channel);
    return result;
  

  // const admin = await this.userService.findOnebyId(adminId);

  // // Check if the admin is in the channel's list of admins
  // const isAdmin = channel.admins.some(admin => admin.id === userId);
  // if (!isAdmin){
  //   throw new Error("Only admins are authorized to remove members from the channel.");
  // }

  // try {
  //   await this.removeAdmin(channel, userId);
  // } catch (e) {}

  // const user = await this.userService.findOnebyId(userId);
  // const userRemovedList = channel.members.filter((chanUser) => {
  //   return chanUser.id !== user.id;
  // });

  // await this.channelRepository.update(channel.id, {
  //   members: userRemovedList,
  // });
  // return user;
}




// async muteMember(channelName: string, adminId: number, username: string){

//   console.log("MUTE MEMBER CALLED SERVICE")
//   const channel = await this.findOneByName(channelName);
//   const user = await this.userService.findOneByName(username);
  
//   if (!channel) {
//     throw new Error(`Channel ${channelName} not found`);
//   }

//   if (!user) {
//     throw new Error(`User ${username} not found`);
//   }

//   const mutedUntil = new Date(Date.now() + 60 * 1000); // 1 minute, change to 120000 for 2 minutes
// console.log(user.username, "mutedUntil",  mutedUntil)
//   if (!channel.mutedMembers) {
//     channel.mutedMembers = [];
//     console.log("no muted members yet")
//   }

//   // channel.mutedMembers.push({ user, mutedUntil });
//   channel.mutedMembers.push(user);

//   await this.channelRepository.save(channel);
//   // return result;
  

//   // const admin = await this.userService.findOnebyId(adminId);

//   // // Check if the admin is in the channel's list of admins
//   // const isAdmin = channel.admins.some(admin => admin.id === userId);
//   // if (!isAdmin){
//   //   throw new Error("Only admins are authorized to remove members from the channel.");
//   // }

//   // try {
//   //   await this.removeAdmin(channel, userId);
//   // } catch (e) {}

//   // const user = await this.userService.findOnebyId(userId);
//   // const userRemovedList = channel.members.filter((chanUser) => {
//   //   return chanUser.id !== user.id;
//   // });

//   // await this.channelRepository.update(channel.id, {
//   //   members: userRemovedList,
//   // });
//   // return user;
// }





async muteMember(channelName: string, adminId: number, username: string){
  console.log("MUTE MEMBER CALLED SERVICE");
  const channel = await this.findOneByName(channelName);
  const user = await this.userService.findOneByName(username);
  
  if (!channel) {
    throw new Error(`Channel ${channelName} not found`);
  }

  if (!user) {
    throw new Error(`User ${username} not found`);
  }

  const mutedUntil = new Date(Date.now() + 60 * 1000); // 1 minute, change to 120000 for 2 minutes
  console.log(user.username, "mutedUntil", mutedUntil);

  if (!channel.mutedMembers) {
    channel.mutedMembers = [];
    console.log("no muted members yet");
  }

  channel.mutedMembers.push(user);

  await this.channelRepository.save(channel);

  setTimeout(() => {
    this.removeMutedMember(channel, user);
  }, 60 * 1000); // 1 minute, change to 120000 for 2 minutes
}

private removeMutedMember(channel: Channel, user: User) {
  const index = channel.mutedMembers.findIndex((mutedUser) => mutedUser.id === user.id);

  if (index >= 0) {
    channel.mutedMembers.splice(index, 1);
    this.channelRepository.save(channel);
  }
}





// async createDmChat(user1: User, user2: User) {
//   // async createDmChat(user1: number, user2: number) {
//   const dm = await this.findOneDm(user1.id, user2.id);
//   if (dm)
//     return dm;
//   const channelDto: CreateChannelDto = {
//     name: `${user1.username}_${user2.username}`,
//     dm: true,
//     members: [user1, user2],
//   };
  
//   const newChannel = await this.createChannel(channelDto);
  
//   return newChannel;
// }

async createDm(username1: string, username2: string) {
 const user1 =  await this.userService.findOneByName(username1);
 if (!user1)
  return;
 const user2 =  await this.userService.findOneByName(username2);
 if (!user2)
  return;
  // async createDmChat(user1: number, user2: number) {
  const dm = await this.findOneDm(user1.id, user2.id);
  if (dm){
  console.log("dm was found")
  return dm;
  }
    console.log("after dm found")
  const channelDto: CreateChannelDto = {
    name: `${user1.username}_${user2.username}`,
    dm: true,
    members: [user1, user2],
    owner: user1,
    accessType: `private`,
  };
  
  const newChannel = await this.create(channelDto);
  
  return newChannel;
}
  
  // async findOneDm(user1Id: number, user2Id: number): Promise<Channel | undefined> 
  // {
  //   // Find all channels where the privacy is “dm” and the number of members is exactly 2
  // const privateChannels = await this.channelRepository.find({
  //   where: (qb: SelectQueryBuilder<Channel>) => {
  //     qb.where('channel.isDM = :isDM', { isDM: true });
  //   },
  //   relations: ['members'],
  // });
    
  //   // Look for a private channel with exactly two members matching the given user IDs
  //   const dm = privateChannels.find(channel => {
  //     const memberIds = channel.members.map(member => member.id);
  //     return memberIds.includes(user1Id) && memberIds.includes(user2Id) && memberIds.length === 2;
  //   });
  
  //   return dm;
  // }

  async findOneDm(user1Id: number, user2Id: number): Promise<Channel | undefined> {
    const privateChannels = await this.channelRepository.createQueryBuilder('channel')
      .innerJoin('channel.members', 'members')
      .groupBy('channel.id')
      .having('COUNT(members.id) = :count', { count: 2 })
      .andHaving('MAX(members.id) = :user1Id', { user1Id })
      .andHaving('MIN(members.id) = :user2Id', { user2Id })
      .andWhere('channel.dm = :dm', { dm: true })
      .getMany();
  

      const dm = privateChannels.find(channel => {
        for (let k = 0; k < channel.members.length; k++) {
          if (channel.members[k].id === user1Id) {
            for (let j = 0; j < channel.members.length; j++) {
              if (channel.members[j].id === user2Id && j !== k) {
                return true;
              }
            }
          }
        }
        return false;
      });
    
      return dm;
    }
  
  
  
  
  

  async remove(id: number): Promise<void> {
    await this.channelRepository.delete(id);
  }


}