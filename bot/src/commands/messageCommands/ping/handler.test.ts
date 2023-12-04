import {
  ChannelType,
  DMChannel,
  Message as DiscordMessage,
  TextChannel,
  User,
} from 'discord.js';
import { ping } from './handler';

import { instance, mock, when } from 'ts-mockito';

describe('pingCommand', () => {
  const userMock = mock(User);
  const textChannelMock = mock(TextChannel);
  const messageMock = mock(DiscordMessage);

  it('should respond with "pong!"', async () => {
    when(userMock.bot).thenReturn(false);

    when(textChannelMock.type).thenReturn(ChannelType.GuildText);

    when(messageMock.author).thenReturn(instance(userMock));
    when(messageMock.channel).thenReturn(instance(textChannelMock));

    const textChannelInstance = instance(textChannelMock);
    const messageInstance = instance(messageMock);

    when(textChannelMock.send).thenReturn(jest.fn());

    await ping.run(messageInstance);

    expect(textChannelInstance.send).toHaveBeenCalledWith('pong!');
  });

  it('should not respond with "pong!" if it is a bot', async () => {
    when(userMock.bot).thenReturn(true);

    when(textChannelMock.type).thenReturn(ChannelType.GuildText);

    when(messageMock.author).thenReturn(instance(userMock));
    when(messageMock.channel).thenReturn(instance(textChannelMock));

    const textChannelInstance = instance(textChannelMock);
    const messageInstance = instance(messageMock);

    when(textChannelMock.send).thenReturn(jest.fn());

    await ping.run(messageInstance);

    expect(textChannelInstance.send).not.toBeCalledWith('pong!');
  });

  it('should not respond with "pong!" if it is in a DM', async () => {
    when(userMock.bot).thenReturn(false);
    const textDMChannelMock = mock(DMChannel);

    when(textDMChannelMock.type).thenReturn(ChannelType.DM);

    when(messageMock.author).thenReturn(instance(userMock));
    when(messageMock.channel).thenReturn(instance(textDMChannelMock));

    const textChannelInstance = instance(textDMChannelMock);
    const messageInstance = instance(messageMock);

    when(textDMChannelMock.send).thenReturn(jest.fn());

    await ping.run(messageInstance);

    expect(textChannelInstance.send).not.toBeCalledWith('pong!');
  });
});
