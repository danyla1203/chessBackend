import 'reflect-metadata';

export const UseValidation = (validation: any) => {
  return function (target: any, methodName: string) {
    const handler = Reflect.getMetadata(methodName, target);
    if (handler) {
      handler.validationClass = validation;
    }
  };
};
