import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { mockMethodCall } from 'meteor/quave:testing';
import { assert } from 'chai';
import { TasksCollection } from '/imports/db/TasksCollection';
import '/imports/api/tasksMethods';

if (Meteor.isServer) {
  describe('Tasks', () => {
    describe('methods', () => {
      const userId = Random.id();
      let taskId;

      beforeEach(async () => {
        await TasksCollection.removeAsync({});
        taskId = await TasksCollection.insertAsync({
          text: 'Test Task',
          createdAt: new Date(),
          userId,
        });
      });

      it('can delete owned task', async () => {
        await mockMethodCall('tasks.remove', taskId, { context: { userId } });

        const tasksCount = await TasksCollection.find({}).countAsync();
        assert.equal(tasksCount, 0);
      });

      it(`can't delete task without an user authenticated`, async () => {
        try {
          await mockMethodCall('tasks.remove', taskId);
          assert.fail('Expected Not authorized error.');
        } catch (error) {
          assert.equal(error.error, 'not-authorized');
          assert.match(error.reason, /Not authorized/);
        }

        const tasksCount = await TasksCollection.find({}).countAsync();
        assert.equal(tasksCount, 1);
      });

      it(`can't delete task from another owner`, async () => {
        try {
          await mockMethodCall('tasks.remove', taskId, {
            context: { userId: 'somebody-else-id' },
          });
          assert.fail('Expected Access denied error.');
        } catch (error) {
          assert.equal(error.error, 'access-denied');
          assert.match(error.reason, /Access denied/);
        }

        const tasksCount = await TasksCollection.find({}).countAsync();
        assert.equal(tasksCount, 1);
      });

      it('can change the status of a task', async () => {
        const originalTask = await TasksCollection.findOneAsync(taskId);
        await mockMethodCall('tasks.setIsChecked', taskId, !originalTask.isChecked, {
          context: { userId },
        });

        const updatedTask = await TasksCollection.findOneAsync(taskId);
        assert.notEqual(updatedTask.isChecked, originalTask.isChecked);
      });

      it('can insert new tasks', async () => {
        const text = 'New Task';
        await mockMethodCall('tasks.insert', text, {
          context: { userId },
        });

        const tasks = await TasksCollection.find({}).fetchAsync();
        assert.equal(tasks.length, 2);
        assert.isTrue(tasks.some(task => task.text === text));
      });
    });
  });
}
