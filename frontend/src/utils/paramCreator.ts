type PopulateObject = {
  [key: string]: boolean | PopulateObject;
};

export function paramCreator(obj: PopulateObject): string {
  const result: string[] = [];

  function process(currentObj: PopulateObject, path: string[]): void {
    let index = 0;

    for (const key of Object.keys(currentObj)) {
      const value = currentObj[key];

      if (typeof value === "boolean" && value) {
        if (path.length === 0) {
          result.push(`populate[${index}]=${key}`);
        } else {
          const pathString = path.join("][");
          result.push(`populate[${pathString}][populate][${index}]=${key}`);
        }
        index++;
      } else if (typeof value === "object" && value !== null) {
        process(value as PopulateObject, path.concat(key));
      }
    }
  }

  process(obj, []);
  return result.join("&");
}
