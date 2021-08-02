import request from 'supertest';
import { expect } from 'chai';
import { buildUser, buildTeam, createUser, createTeam } from './factories';
import { startDatabase } from './utils';
import { User } from 'data/models';
import { app } from 'server/app';
import { server } from 'server/index';

const ENDPOINT = '/user';

describe('User tests', () => {
  beforeEach(async () => {
    await startDatabase();
  });

  afterAll(async () => {
    await server.close();
  });

  it('Should respond with a new created user', async () => {
    const fakeUser = await buildUser({});

    const response = await request(app).post(ENDPOINT).send(fakeUser);

    expect(response.status).to.equal(201);
    expect(response.statusCode).to.equal(201);

    const responseUser = response.body.data;

    const user = await User.findByPk(responseUser.id);

    expect(user.username).to.equal(fakeUser.username);
    expect(user.firstName).to.equal(fakeUser.firstName);
    expect(user.lastName).to.equal(fakeUser.lastName);
  });

  it('Should respond with a new created user with many to many related models', async () => {
    const memberOfDict = await buildTeam({});
    const fakeMemberOf = await createTeam(memberOfDict);

    const fakeUser = await buildUser({ memberOf: [fakeMemberOf.id] });

    const response = await request(app).post(ENDPOINT).send(fakeUser);

    expect(response.status).to.equal(201);
    expect(response.statusCode).to.equal(201);

    const responseUser = response.body.data;

    const user = await User.findByPk(responseUser.id, {
      include: ['memberOf'],
    });

    expect(user.memberOf[0].id).to.equal(fakeMemberOf.id);
    expect(user.memberOf.length).to.equal(1);
  });

  it('Should respond with a user', async () => {
    const userDict = await buildUser({});
    const fakeUser = await createUser(userDict);

    const response = await request(app).get(`${ENDPOINT}/${fakeUser.id}`);

    const { statusCode, status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(statusCode).to.equal(200);

    expect(data.id).to.equal(fakeUser.id);
    expect(data.username).to.equal(fakeUser.username);
    expect(data.firstName).to.equal(fakeUser.firstName);
    expect(data.lastName).to.equal(fakeUser.lastName);

    expect(data.createdTasks).to.eql([]);
    expect(data.assignedTasksPrimary).to.eql([]);
    expect(data.assignedTasksSecondary).to.eql([]);
    expect(data.createdProjects).to.eql([]);
  });
  it('Should throw an error if user was not found', async () => {
    const userDict = await buildUser({});
    const fakeUser = await createUser(userDict);
    const { id } = fakeUser;
    await fakeUser.destroy();

    const response = await request(app).get(`${ENDPOINT}/${id}`);
    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
  it('Should respond with a list of users', async () => {
    const response = await request(app).get(ENDPOINT);

    const { statusCode, status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(statusCode).to.equal(200);

    const allUser = await User.findAll();
    expect(data.length).to.equal(allUser.length);
  });
  it('Should respond with an updated user', async () => {
    const userDict = await buildUser({});
    const fakeUser = await createUser(userDict);

    const anotherFakeUser = await buildUser({});

    const response = await request(app).put(`${ENDPOINT}/${fakeUser.id}`).send({
      username: anotherFakeUser.username,
      firstName: anotherFakeUser.firstName,
      lastName: anotherFakeUser.lastName,
    });

    const { status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(response.statusCode).to.equal(200);

    expect(data.username).to.equal(anotherFakeUser.username);
    expect(data.firstName).to.equal(anotherFakeUser.firstName);
    expect(data.lastName).to.equal(anotherFakeUser.lastName);

    const updatedUser = await User.findByPk(fakeUser.id);

    expect(updatedUser.username).to.equal(anotherFakeUser.username);
    expect(updatedUser.firstName).to.equal(anotherFakeUser.firstName);
    expect(updatedUser.lastName).to.equal(anotherFakeUser.lastName);
  });

  it('Should not update user, if User does not exists', async () => {
    const userDict = await buildUser({});
    const fakeUser = await createUser(userDict);
    const { id } = fakeUser;
    await fakeUser.destroy();

    const response = await request(app).put(`${ENDPOINT}/${id}`).send({
      username: userDict.username,
      firstName: userDict.firstName,
      lastName: userDict.lastName,
    });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
  it('Should respond with an updated user (no updates)', async () => {
    const userDict = await buildUser({});
    const fakeUser = await createUser(userDict);

    const response = await request(app)
      .patch(`${ENDPOINT}/${fakeUser.id}`)
      .send({ memberOf: [] });

    const { status } = response;

    expect(status).to.equal(200);
    expect(response.statusCode).to.equal(200);
  });

  it('Should respond with an updated user', async () => {
    const userDict = await buildUser({});
    const fakeUser = await createUser(userDict);

    const anotherFakeUser = await buildUser({});

    const response = await request(app)
      .patch(`${ENDPOINT}/${fakeUser.id}`)
      .send({ username: anotherFakeUser.username });

    const { status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(response.statusCode).to.equal(200);

    expect(data.username).to.equal(anotherFakeUser.username);

    const updatedUser = await User.findByPk(fakeUser.id);

    expect(updatedUser.username).to.equal(anotherFakeUser.username);
  });

  it('Should not update user, if User does not exists', async () => {
    const userDict = await buildUser({});
    const fakeUser = await createUser(userDict);
    const { id } = fakeUser;
    const username = fakeUser.username;
    await fakeUser.destroy();

    const response = await request(app)
      .patch(`${ENDPOINT}/${id}`)
      .send({ username: username });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
  it('Should respond with a deleted user', async () => {
    const userDict = await buildUser({});
    const fakeUser = await createUser(userDict);

    const response = await request(app).delete(`${ENDPOINT}/${fakeUser.id}`);

    const { status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(response.statusCode).to.equal(200);

    expect(data.id).to.equal(fakeUser.id);

    const deletedUser = await User.findByPk(fakeUser.id);
    expect(deletedUser).to.equal(null);
  });

  it('Should not delete user, if User does not exists', async () => {
    const userDict = await buildUser({});
    const fakeUser = await createUser(userDict);
    const { id } = fakeUser;
    await fakeUser.destroy();

    const response = await request(app).delete(`${ENDPOINT}/${id}`);

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
});
