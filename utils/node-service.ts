import { TreeSelectSelectionKeysType } from 'primereact/treeselect';

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
  },

  async getMerchantTreeNodes() {
    const res = await fetch('/api/merchants', {
      method: 'GET',
      headers: new Headers({ 'Content-Type': 'application/json' })
    });

    if (!res.ok) {
      console.log('Error in getTreeNodesData', { res });

      throw Error(res.statusText);
    }

    const data = await res.json();
    var merchants = await data.result;

    merchants = merchants.map((merchant: any) => ({
      key: merchant.url,
      label: merchant.name
    }));

    return merchants;
  },

  getMerchants() {
    return Promise.resolve(this.getMerchantTreeNodes());
  },

  async getBrandTreeNodes(cat_ids: number[]) {
    const res = await fetch('/api/merchants', {
      method: 'GET',
      headers: new Headers({ 'Content-Type': 'application/json' })
    });

    if (!res.ok) {
      console.log('Error in getTreeNodesData', { res });

      throw Error(res.statusText);
    }

    const data = await res.json();
    var merchants = await data.result;

    merchants = merchants.map((merchant: any) => ({
      key: merchant.url,
      label: merchant.name
    }));

    return merchants;
  },

  getBrands(cat_ids: number[]) {
    return Promise.resolve(this.getBrandTreeNodes(cat_ids));
  },

  getCategorySlugAndLevel(index: string, tree: any) {
    const indexArray = index.split('-');
    let resultNode = tree[indexArray[0]];
    let resultNodeLevel = 1;

    for (let i = 1; i < indexArray.length; i++) {
      resultNode = resultNode.children[indexArray[i]];
      resultNodeLevel = i + 1;
    }

    return { slug: resultNode.data, level: resultNodeLevel };
  },

  async transformCategories(
    selectedCategoriesKeys:
      | string
      | TreeSelectSelectionKeysType
      | TreeSelectSelectionKeysType[]
      | null
      | undefined,
    selectedBrandsKeys:
      | string
      | TreeSelectSelectionKeysType
      | TreeSelectSelectionKeysType[]
      | null
      | undefined,
    allCategories: any
  ) {
    let transformedCategories = [];
    let transformedBrands = [];

    // convert selected categories to db format and push all to transformedCategories array
    if (typeof selectedCategoriesKeys === 'object') {
      let subtreesToSkip: string[] = [];

      for (const key in selectedCategoriesKeys) {
        if (selectedCategoriesKeys.hasOwnProperty(key)) {
          // @ts-ignore
          const value = selectedCategoriesKeys[key];
          if (!subtreesToSkip.some((substring) => key.startsWith(substring))) {
            if (!value.partialChecked) {
              subtreesToSkip.push(key);
              const category = NodeService.getCategorySlugAndLevel(
                key,
                allCategories
              );
              transformedCategories.push(category);
            }
          }
        }
      }
    }

    // convert selected brands to db format and push all to transformedBrands array
    if (typeof selectedBrandsKeys === 'object') {
      let subtreesToSkip: string[] = [];

      for (const key in selectedBrandsKeys) {
        if (selectedBrandsKeys.hasOwnProperty(key)) {
          // @ts-ignore
          const value = selectedBrandsKeys[key];
          if (!subtreesToSkip.some((substring) => key.startsWith(substring))) {
            if (!value.partialChecked) {
              subtreesToSkip.push(key);
              const category = NodeService.getCategorySlugAndLevel(
                key,
                allCategories
              );
              transformedBrands.push(category);
            }
          }
        }
      }
    }

    const brandsAndCategories = [
      ...transformedCategories,
      ...transformedBrands
    ];

    // remove duplicates from brandsAndCategories array
    const jointCategories: { slug: string; level: number }[] = [];
    brandsAndCategories.forEach((item) => {
      if (
        !jointCategories.some(
          (categoryOrBrand) => categoryOrBrand.slug === item.slug
        )
      ) {
        jointCategories.push(item);
      }
    });

    return jointCategories;
  },

  categoryTreeToCategorySlugsArray(tree: any, allCategories: any) {
    var transformedCategories = [];

    if (typeof tree === 'object') {
      let subtreesToSkip: string[] = [];

      for (const key in tree) {
        if (tree.hasOwnProperty(key)) {
          if (!subtreesToSkip.some((substring) => key.startsWith(substring))) {
            const category = NodeService.getCategorySlugAndLevel(
              key,
              allCategories
            );
            transformedCategories.push(category);
          }
        }
      }
    }
    return transformedCategories.map((cat: any) => cat.slug);
  },

  async getBrandsFromCategoryTree(tree: any, allCategories: any) {
    const categorySlugs = NodeService.categoryTreeToCategorySlugsArray(
      tree,
      allCategories
    );

    const res = await fetch('/api/brands?slugs=' + categorySlugs.join(','), {
      method: 'GET',
      headers: new Headers({ 'Content-Type': 'application/json' })
    });

    if (!res.ok) {
      console.log('Error in getBrandsFromCategoryTree', { res });

      throw Error(res.statusText);
    }

    const data = await res.json();

    var brands = await data.brands;

    if (brands) {
      brands = brands.map((brand: any) => ({
        key: brand.slug,
        label: brand.name
      }));
    }

    return brands;
  },

  async getAllPreferences() {
    const res = await fetch('/api/deal-subscription-preference', {
      method: 'GET',
      headers: new Headers({ 'Content-Type': 'application/json' })
    });

    if (!res.ok) {
      console.log('Error in getAllPreferences', { res });

      throw Error(res.statusText);
    }

    const data = await res.json();

    return data.resultAllPreferences.data;
  },

  async getPreferenceById(id: number) {
    const res = await fetch('/api/deal-subscription-preference?id=' + id, {
      method: 'GET',
      headers: new Headers({ 'Content-Type': 'application/json' })
    });

    if (!res.ok) {
      console.log('Error in getPreferenceById', { res });

      throw Error(res.statusText);
    }

    const data = await res.json();

    return data.resultPreference.data;
  }
};
