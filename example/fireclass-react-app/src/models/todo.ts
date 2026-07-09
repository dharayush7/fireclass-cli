import { IsBoolean, IsString } from "class-validator";
import { BaseModel, Collection } from "../lib/fireclass";

@Collection("todos")
export class Todo extends BaseModel<Todo> {
  @IsString()
  title!: string;

  @IsBoolean()
  done!: boolean;

  createdAt?: Date;

  constructor(data?: Partial<Todo>) {
    super(data);
    Object.assign(this, data);
  }
}
