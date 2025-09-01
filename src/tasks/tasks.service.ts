import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from '../schemas/task.schema';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { QueryTaskDto } from '../dto/query-task.dto';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const task = new this.taskModel({
      ...createTaskDto,
      userId,
    });
    return task.save();
  }

  async findAll(queryDto: QueryTaskDto, userId: string) {
    const { status, page = '1', page_size = '10' } = queryDto;
    const pageNum = parseInt(page, 10);
    const pageSize = parseInt(page_size, 10);
    const skip = (pageNum - 1) * pageSize;

    const filter: Record<string, any> = { userId };
    if (status) {
      filter.status = status;
    }

    const [tasks, total] = await Promise.all([
      this.taskModel
        .find(filter)
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: -1 }),
      this.taskModel.countDocuments(filter),
    ]);

    return {
      tasks,
      pagination: {
        page: pageNum,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Task> {
    try {
      const task = await this.taskModel.findOne({ _id: id, userId });
      if (!task) {
        throw new NotFoundException('Task not found');
      }
      return task;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundException('Task not found');
      }
      throw error;
    }
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<Task> {
    try {
      const task = await this.taskModel.findOneAndUpdate(
        { _id: id, userId },
        updateTaskDto,
        { new: true },
      );
      if (!task) {
        throw new NotFoundException('Task not found');
      }
      return task;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundException('Task not found');
      }
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const result = await this.taskModel.deleteOne({ _id: id, userId });
      if (result.deletedCount === 0) {
        throw new NotFoundException('Task not found');
      }
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundException('Task not found');
      }
      throw error;
    }
  }
}
