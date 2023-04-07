import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelService {
  static findAll() {
    throw new Error("Method not implemented.");
}
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

  async create(createChannelDto: CreateChannelDto) {
    const channel = this.channelRepository.create(createChannelDto);
    return this.channelRepository.save(channel);
  }

  // async findAll(): Promise<Channel[]> {
  //   return this.channelRepository.find();
  // }
  async findAll() {
    const channels = await this.channelRepository.find();
    return channels;
  }

  // async findOne(id: number): Promise<Channel> {
  //   return this.channelRepository.findOne({ where: { id } });
  // }

  async findOne(id : number) : Promise<Channel | undefined> {
    const channel = await this.channelRepository
    .createQueryBuilder('channel')
    .select('channel')
    .where('channel.id = :id', {id})
    .getOne();

    return channel;
  }
  
  async update(id: number, updateChannelDto: UpdateChannelDto): Promise<Channel> {
  const channel = await this.channelRepository.findOne({ where: { id } });
  if (!channel) {
    throw new Error(`Channel with ID ${id} not found`);
  }
  Object.assign(channel, updateChannelDto);
  return this.channelRepository.save(channel);
}


  async remove(id: number): Promise<void> {
    await this.channelRepository.delete(id);
  }
}
