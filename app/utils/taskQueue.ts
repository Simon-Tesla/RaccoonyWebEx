import * as logger from '../logger';

type TaskFn<TRes> = (task: Readonly<ITask<TRes>>) => Promise<TRes>;

export interface ITask<TRes> {
    id: number;
    run: TaskFn<TRes>;
    promise: Promise<TRes> | undefined;
    state: TaskState;
    result: TRes | undefined;
    error: unknown;
    delayMs: number;
}

export enum TaskState {
    ready,
    running,
    resolved,
    rejected
}

let lastTaskId = 0;

/**
 * Represents a task to be run asynchronously.
 */
export class Task<T = unknown> implements ITask<T> {
    id = lastTaskId++;
    run: TaskFn<T>;
    promise: Promise<T> | undefined = undefined;
    state: TaskState = TaskState.ready
    result: T | undefined = undefined;
    error: unknown = null;
    delayMs = 0;

    constructor(taskFn: TaskFn<T>, delayMs: number = 0) {
        this.run = taskFn;
        this.delayMs = delayMs;
    }
}

export interface TaskQueueOptions {
    delayBetweenItemsMs: number;
}

/**
 * A queue for managing execution of Tasks sequentially
 */
export class TaskQueue<T = unknown> {
    private options: TaskQueueOptions;
    private queue: ITask<T>[] = [];
    private currentTask: ITask<T> | undefined = undefined;
    private isStopped = false;
    private currentTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

    constructor(options: TaskQueueOptions) {
        this.options = {
            ...options
        };
    }

    enqueue(task: ITask<T>) {
        this.queue.push(task);
        this.processQueue();
    }

    stop() {
        if (this.currentTask?.state === TaskState.running) {
            // Prevent the current task from running and put it back onto the queue.
            clearTimeout(this.currentTimeout);
            this.queue.unshift(this.currentTask);
        }
        this.currentTask = undefined;
        this.currentTimeout = undefined;
        this.isStopped = true;
    }

    resume() {
        this.isStopped = false;
        this.processQueue();
    }

    clear() {
        clearTimeout(this.currentTimeout);
        this.currentTask = undefined;
        this.currentTimeout = undefined;
        this.queue = [];
    }

    get isRunning() {
        return this.currentTask && this.currentTask.state === TaskState.running;
    }

    private processQueue() {
        if (this.isStopped) {
            logger.debug("Queue stopped", {queueLen: this.queue.length, queue: this});
            return;
        }
        if (this.isRunning) {
            logger.debug("Queue already running", {queueLen: this.queue.length, queue: this});
            return;
        }

        const currTask = this.queue.shift();
        if (!currTask) {
            logger.debug("Queue empty", {queueLen: this.queue.length, queue: this});
            return;
        }

        const prevTask = this.currentTask;
        this.currentTask = currTask;
        currTask.state = TaskState.running;

        // If this is the first task, or the last task got rejected, run immediately.
        const delayMs = !prevTask || prevTask?.state === TaskState.rejected ? 0 : this.options.delayBetweenItemsMs + currTask.delayMs;
        logger.debug("Processing next queue item", {task: currTask, delayMs, queueLen: this.queue.length, queue: this});
        currTask.promise = new Promise<T>((resolve, reject) => {
            this.currentTimeout = setTimeout(() => {
                currTask.run(currTask).then((res: T) => {
                    currTask.state = TaskState.resolved;
                    currTask.result = res;
                    resolve(res);
                }, 
                (error: unknown) => {
                    currTask.state = TaskState.rejected;
                    currTask.error = error;
                    reject(error);
                });
            }, delayMs);
        });
        
        // If this is the last item on the queue, have the task clean up after itself.
        currTask.promise.finally(() => {
            logger.debug("Finished processing item", {state: currTask.state, task: currTask, queueLen: this.queue.length, queue: this});
            if (this.queue.length === 0) {
                this.currentTask = undefined;
                clearTimeout(this.currentTimeout);
                this.currentTimeout = undefined;
            }
            this.processQueue();
        });
    }
}