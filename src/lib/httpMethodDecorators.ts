import 'reflect-metadata';

export const get = (path: string) => {
  return function (target: any, methodName: string, funcDescriptor: any) {
    const handler = {
      method: 'GET',
      path: path,
      handlerFunc: funcDescriptor.value,
    };
    Reflect.defineMetadata(`${path}|${methodName}`, handler, target);
  };
};

export const post = (path: string) => {
  return function (target: any, methodName: string, funcDescriptor: any) {
    const handler = {
      method: 'POST',
      path: path,
      handlerFunc: funcDescriptor.value,
    };
    Reflect.defineMetadata(`${path}|${methodName}`, handler, target);
  };
};

export const Delete = (path: string) => {
  return function (target: any, methodName: string, funcDescriptor: any) {
    const handler = {
      method: 'DELETE',
      path: path,
      handlerFunc: funcDescriptor.value,
    };
    Reflect.defineMetadata(`${path}|${methodName}`, handler, target);
  };
};

export const put = (path: string) => {
  return function (target: any, methodName: string, funcDescriptor: any) {
    const handler = {
      method: 'PUT',
      path: path,
      handlerFunc: funcDescriptor.value,
    };
    Reflect.defineMetadata(`${path}|${methodName}`, handler, target);
  };
};