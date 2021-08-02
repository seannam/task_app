import request from 'supertest';
import { expect } from 'chai';
import { buildTeam, buildUser, createTeam, createUser } from './factories';
import { startDatabase } from './utils';
import { Team } from 'data/models';
import { app } from 'server/app';
import { server } from 'server/index';

const ENDPOINT = '/team';

describe('Team tests', () => {
  beforeEach(async () => {
    await startDatabase();
  });

  after(async () => {
    await server.close();
  });

  it('Should respond with a new created team', async () => {
    const fakeTeam = await buildTeam({});

    const response = await request(app).post(ENDPOINT).send(fakeTeam);

    expect(response.status).to.equal(201);
    expect(response.statusCode).to.equal(201);

    const responseTeam = response.body.data;

    const team = await Team.findByPk(responseTeam.id);

    expect(team.name).to.equal(fakeTeam.name);
  });

  it('Should respond with a new created team with many to many related models', async () => {
    const membersDict = await buildUser({});
    const fakeMembers = await createUser(membersDict);

    const fakeTeam = await buildTeam({ members: [fakeMembers.id] });

    const response = await request(app).post(ENDPOINT).send(fakeTeam);

    expect(response.status).to.equal(201);
    expect(response.statusCode).to.equal(201);

    const responseTeam = response.body.data;

    const team = await Team.findByPk(responseTeam.id, { include: ['members'] });

    expect(team.members[0].id).to.equal(fakeMembers.id);
    expect(team.members.length).to.equal(1);
  });

  it('Should respond with a team', async () => {
    const teamDict = await buildTeam({});
    const fakeTeam = await createTeam(teamDict);

    const response = await request(app).get(`${ENDPOINT}/${fakeTeam.id}`);

    const { statusCode, status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(statusCode).to.equal(200);

    expect(data.id).to.equal(fakeTeam.id);
    expect(data.name).to.equal(fakeTeam.name);
  });
  it('Should throw an error if team was not found', async () => {
    const teamDict = await buildTeam({});
    const fakeTeam = await createTeam(teamDict);
    const { id } = fakeTeam;
    await fakeTeam.destroy();

    const response = await request(app).get(`${ENDPOINT}/${id}`);
    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
  it('Should respond with a list of teams', async () => {
    const response = await request(app).get(ENDPOINT);

    const { statusCode, status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(statusCode).to.equal(200);

    const allTeam = await Team.findAll();
    expect(data.length).to.equal(allTeam.length);
  });
  it('Should respond with an updated team', async () => {
    const teamDict = await buildTeam({});
    const fakeTeam = await createTeam(teamDict);

    const anotherFakeTeam = await buildTeam({});

    const response = await request(app).put(`${ENDPOINT}/${fakeTeam.id}`).send({
      name: anotherFakeTeam.name,
    });

    const { status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(response.statusCode).to.equal(200);

    expect(data.name).to.equal(anotherFakeTeam.name);

    const updatedTeam = await Team.findByPk(fakeTeam.id);

    expect(updatedTeam.name).to.equal(anotherFakeTeam.name);
  });

  it('Should not update team, if Team does not exists', async () => {
    const teamDict = await buildTeam({});
    const fakeTeam = await createTeam(teamDict);
    const { id } = fakeTeam;
    await fakeTeam.destroy();

    const response = await request(app).put(`${ENDPOINT}/${id}`).send({
      name: teamDict.name,
    });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
  it('Should respond with an updated team (no updates)', async () => {
    const teamDict = await buildTeam({});
    const fakeTeam = await createTeam(teamDict);

    const response = await request(app)
      .patch(`${ENDPOINT}/${fakeTeam.id}`)
      .send({ members: [] });

    const { status } = response;

    expect(status).to.equal(200);
    expect(response.statusCode).to.equal(200);
  });

  it('Should respond with a deleted team', async () => {
    const teamDict = await buildTeam({});
    const fakeTeam = await createTeam(teamDict);

    const response = await request(app).delete(`${ENDPOINT}/${fakeTeam.id}`);

    const { status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(response.statusCode).to.equal(200);

    expect(data.id).to.equal(fakeTeam.id);

    const deletedTeam = await Team.findByPk(fakeTeam.id);
    expect(deletedTeam).to.equal(null);
  });

  it('Should not delete team, if Team does not exists', async () => {
    const teamDict = await buildTeam({});
    const fakeTeam = await createTeam(teamDict);
    const { id } = fakeTeam;
    await fakeTeam.destroy();

    const response = await request(app).delete(`${ENDPOINT}/${id}`);

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
});
