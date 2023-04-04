import 'reflect-metadata';

export const MessagePattern = (action: string) => {
  return function (target: any, methodName: string, funcDescriptor: any) {
    const handler = {
      action,
      handlerFunc: funcDescriptor.value,
    };
    funcDescriptor.enurable = true;
    Reflect.defineMetadata(action, handler, target);
    Reflect.defineMetadata(methodName, handler, target);
  };
};
