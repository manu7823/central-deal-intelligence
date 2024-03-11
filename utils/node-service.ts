export const NodeService = {
  async getTreeNodesData() {
    const res = await fetch('/api/categories', {
      method: 'GET',
      headers: new Headers({ 'Content-Type': 'application/json' })
    });

    if (!res.ok) {
      console.log('Error in getTreeNodesData', { res });

      throw Error(res.statusText);
    }

    const data = await res.json();

    var categories = await data.res;

    const newCats = categories
      .filter((cat: any) => cat.parent == 0)
      .map((cat1: any, idx1: number) => ({
        key: String(idx1),
        label: cat1.name,
        data: cat1.slug,
        children: categories
          .filter((child: any) => child.parent == cat1.id)
          .map((cat2: any, idx2: number) => ({
            key: idx1 + '-' + idx2,
            label: cat2.name,
            data: cat2.slug,
            children: categories
              .filter((child: any) => child.parent == cat2.id)
              .map((cat3: any, idx3: number) => ({
                key: idx1 + '-' + idx2 + '-' + idx3,
                label: cat3.name,
                data: cat3.slug,
                children: categories
                  .filter((child: any) => child.parent == cat3.id)
                  .map((cat4: any, idx4: number) => ({
                    key: idx1 + '-' + idx2 + '-' + idx3 + '-' + idx4,
                    label: cat4.name,
                    data: cat4.slug,
                    children: categories
                      .filter((child: any) => child.parent == cat4.id)
                      .map((cat5: any, idx5: number) => ({
                        key:
                          idx1 +
                          '-' +
                          idx2 +
                          '-' +
                          idx3 +
                          '-' +
                          idx4 +
                          '-' +
                          idx5,
                        label: cat5.name,
                        data: cat5.slug,
                        children: categories
                          .filter((child: any) => child.parent == cat5.id)
                          .map((cat6: any, idx6: number) => ({
                            key:
                              idx1 +
                              '-' +
                              idx2 +
                              '-' +
                              idx3 +
                              '-' +
                              idx4 +
                              '-' +
                              idx5 +
                              '-' +
                              idx6,
                            label: cat6.name,
                            data: cat6.slug,
                            children: categories
                              .filter((child: any) => child.parent == cat6.id)
                              .map((cat7: any, idx7: number) => ({
                                key:
                                  idx1 +
                                  '-' +
                                  idx2 +
                                  '-' +
                                  idx3 +
                                  '-' +
                                  idx4 +
                                  '-' +
                                  idx5 +
                                  '-' +
                                  idx6 +
                                  '-' +
                                  idx7,
                                label: cat7.name,
                                data: cat7.slug
                              }))
                          }))
                      }))
                  }))
              }))
          }))
      }));

    return newCats;
  },

  getTreeNodes() {
    return Promise.resolve(this.getTreeNodesData());
  }
};
