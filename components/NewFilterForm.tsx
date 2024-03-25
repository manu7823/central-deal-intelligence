'use client';

import { MultiSelect } from 'primereact/multiselect';
import { FormEvent, useEffect, useState } from 'react';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import InputElement from './InputElement';
import { NodeService } from '@/utils/node-service';
import { useRouter } from 'next/navigation';
import { TreeNode } from 'primereact/treenode';
import { TreeSelect, TreeSelectSelectionKeysType } from 'primereact/treeselect';

interface IDbCategory {
  category: {
    id: number;
    name: string;
    slug: string;
    level: number;
  };
}

interface NewFilterFormProps {
  initPreference?: {
    id: number;
    created_at: string;
    name: string;
    country: string;
    min_score: number;
    delay: number;
    price_error: boolean;
    cadence: string;
    incremental: boolean;
    whatsapp_notification_report: boolean;
    whatsapp_notification_single_deals: boolean;
  };
  initMerchants?: {
    merchant: {
      id: number;
      name: string;
      url: string;
    };
  }[];
  initCategories?: IDbCategory[];
  initBrands?: {
    brand: {
      id: number;
      name: string;
      slug: string;
    };
  }[];
}

const NewFilterForm = ({
  initPreference,
  initMerchants,
  initCategories,
  initBrands
}: NewFilterFormProps) => {
  const defaultName = initPreference?.name;
  const defaultCountry = initPreference?.country || 'germany';
  const defaultMerchants = initMerchants?.map((merchant) => ({
    key: merchant.merchant.url,
    label: merchant.merchant.name
  }));
  const defaultBrands = initBrands?.map((brand) => ({
    key: brand.brand.slug,
    label: brand.brand.name
  }));
  const defaultMinimumScore = initPreference?.min_score || 0;
  const defaultDelay = initPreference?.delay || 0;
  const defaultPriceError = initPreference?.price_error || false;
  const defaultCadence = initPreference?.cadence || 'yesterday';
  const defaultIncrementalOnly = initPreference?.incremental || false;
  const defaultWhatsappNotificationReport =
    initPreference?.whatsapp_notification_report || false;
  const defaultWhatsappNotificationSingleDeals =
    initPreference?.whatsapp_notification_single_deals || false;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [loadingCategories, setLoadingCategories] = useState(true);

  const [merchants, setMerchants] = useState<{ key: string; label: string }[]>(
    []
  );
  const [selectAllMerchants, setSelectAllMerchants] = useState(false);
  const [selectedMerchants, setSelectedMerchants] = useState<
    { key: string; label: string }[]
  >(defaultMerchants || []);

  const router = useRouter();

  const dbCategoriesToTreeNodesRecHelper = (
    categories: IDbCategory[],
    allCategories: TreeNode[],
    parentKey: string = '',
    treeNodes: TreeSelectSelectionKeysType = {},
    hit = false
  ) => {
    allCategories.map((category, idx) => {
      var currentHit = hit;
      categories.map((dbCategory) => {
        if (dbCategory.category.slug == category.data || currentHit) {
          treeNodes = {
            ...treeNodes,
            [parentKey == '' ? idx : parentKey + '-' + idx]: {
              checked: true,
              partialChecked: false
            }
          };
          currentHit = true;
        }
      });

      if (category.children && category.children.length > 0) {
        treeNodes = dbCategoriesToTreeNodesRecHelper(
          categories,
          category.children,
          parentKey == '' ? String(idx) : parentKey + '-' + idx,
          treeNodes,
          currentHit
        );
      }
    });

    return treeNodes;
  };

  const dbCategoriesToTreeNodes = (
    categories: IDbCategory[],
    allCategories: TreeNode[]
  ) => {
    const selectedCategories = dbCategoriesToTreeNodesRecHelper(
      categories,
      allCategories
    );

    console.log('categories', categories);
    console.log('allCategories', allCategories);

    // add partial checked categories
    Object.keys(selectedCategories).map((key) => {
      const allKeys = getAllKeys(key.split('-'));
      allKeys.map((key) => {
        if (!selectedCategories[key]) {
          selectedCategories[key] = {
            checked: false,
            partialChecked: true
          };
        }
      });
    });
    console.log('selectedCategories', selectedCategories);
    return selectedCategories;
  };

  const [allCategories, setAllCategories] = useState<TreeNode[]>([]);
  const [selectedCategoriesKeys, setSelectedCategoriesKeys] = useState<
    | string
    | TreeSelectSelectionKeysType
    | TreeSelectSelectionKeysType[]
    | null
    | undefined
  >(null);

  const [brands, setBrands] = useState<{ key: string; label: string }[]>([]);
  const [selectAllBrands, setSelectAllBrands] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<
    { key: string; label: string }[]
  >(defaultBrands || []);

  useEffect(() => {
    getMerchants();
    getCategories();
  }, []);

  useEffect(() => {
    getBrands();
  }, [selectedCategoriesKeys]);

  const getMerchants = async () => {
    const merchants = await NodeService.getMerchants();
    setMerchants(merchants);
  };

  const getAllKeys = (parts: string[]) => {
    return parts.reduce((result: string[], part, index) => {
      if (index === 0) {
        result.push(part);
      } else {
        result.push(result[index - 1] + '-' + part);
      }
      return result;
    }, []);
  };

  const getCategories = async () => {
    await NodeService.getTreeNodes().then((data) => {
      setAllCategories(data);
      if (initCategories) {
        const selectedCategories = dbCategoriesToTreeNodes(
          initCategories,
          data
        );
        setSelectedCategoriesKeys(selectedCategories);
      }
    });
    setLoadingCategories(false);
  };

  const getBrands = async () => {
    await NodeService.getBrandsFromCategoryTree(
      selectedCategoriesKeys,
      await NodeService.getTreeNodes()
    ).then((data) => {
      if (data) setBrands(data);
    });
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);

    const selectedCategoriesDbFromat = await NodeService.transformCategories(
      selectedCategoriesKeys,
      [],
      allCategories
    );

    try {
      const body = {
        name: formData.get('name'),
        country: formData.get('country'),
        minScore: formData.get('minimum-score'),
        delay: formData.get('delay'),
        priceError: formData.get('price-error') == 'on',
        merchants: JSON.stringify(selectedMerchants),
        categories: JSON.stringify(selectedCategoriesDbFromat),
        brands: JSON.stringify(selectedBrands),
        cadence: formData.get('cadence'),
        incrementalOnly: formData.get('incremental-only') == 'on',
        whatsappNotificationReport:
          formData.get('whatsapp-notification-report') == 'on',
        whatsappNotificationSingleDeals:
          formData.get('whatsapp-notification-single-deals') == 'on'
      };

      const request = {
        method: '',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body)
      };

      if (initPreference) {
        request.method = 'PUT';
        request.body = JSON.stringify({
          ...body,
          id: initPreference.id
        });
      } else {
        request.method = 'POST';
      }

      const response = await fetch(
        '/api/deal-subscription-preference',
        request
      );

      if (response.ok) {
        setSuccess(true);
        setLoading(false);
        setFormSubmitted(true);
        router.push('/cdi/preferences');
      } else {
        setSuccess(false);
        setLoading(false);
        setFormSubmitted(true);
      }
    } catch (err: any) {
      setSuccess(false);
      setLoading(false);
      setFormSubmitted(true);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <InputElement label="Name">
          <input
            type="text"
            name="name"
            id="name"
            className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-sm sm:leading-6"
            placeholder="My first preference"
            required
            defaultValue={defaultName}
          />
        </InputElement>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <InputElement label="Country">
          <select
            id="country"
            name="country"
            autoComplete="country-name"
            className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-sm sm:leading-6"
            required
            defaultValue={defaultCountry}
          >
            <option value="germany">Germany</option>
            <option disabled>Austria</option>
            <option disabled>Brazil</option>
            <option disabled>France</option>
            <option disabled>India</option>
            <option disabled>Italy</option>
            <option disabled>Netherlands</option>
            <option disabled>Poland</option>
            <option disabled>Russia</option>
            <option disabled>Spain</option>
            <option disabled>UK</option>
          </select>
        </InputElement>
        <InputElement label="Retailers">
          <MultiSelect
            value={selectedMerchants}
            options={merchants}
            onChange={(e) => {
              setSelectedMerchants(e.value);
              setSelectAllMerchants(e.value.length === merchants.length);
            }}
            selectAll={selectAllMerchants}
            onSelectAll={(e) => {
              setSelectedMerchants(e.checked ? [] : merchants);
              setSelectAllMerchants(!e.checked);
            }}
            virtualScrollerOptions={{ itemSize: 43 }}
            maxSelectedLabels={3}
            placeholder="Select Retailers"
            className="md:w-20rem w-full border border-gray-300 rounded-md"
            filter
            required
          />
        </InputElement>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <InputElement label="Categories">
          {loadingCategories ? (
            <div className="h-12 rounded-lg border w-full flex justify-start items-center">
              <svg
                className="animate-spin ml-4 h-5 w-5 text-indigo-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : (
            <TreeSelect
              value={selectedCategoriesKeys}
              onChange={(e) => {
                setSelectedCategoriesKeys(e.value);
              }}
              options={allCategories}
              metaKeySelection={false}
              className="md:w-20rem w-full border border-gray-300 rounded-md"
              selectionMode="checkbox"
              placeholder="Select Categories"
              filter
              required
            />
          )}
        </InputElement>
        <InputElement label="Brands">
          <MultiSelect
            value={selectedBrands}
            options={brands}
            onChange={(e) => {
              setSelectedBrands(e.value);
              setSelectAllBrands(e.value.length === brands.length);
            }}
            selectAll={selectAllBrands}
            onSelectAll={(e) => {
              setSelectedBrands(e.checked ? [] : brands);
              setSelectAllBrands(!e.checked);
            }}
            virtualScrollerOptions={{ itemSize: 43 }}
            maxSelectedLabels={3}
            placeholder="Select Brands"
            className="md:w-20rem w-full border border-gray-300 rounded-md"
            filter
            required
          />
        </InputElement>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <InputElement label="Minimum Score">
          <input
            type="number"
            name="minimum-score"
            id="minimum-score"
            className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-sm sm:leading-6"
            required
            defaultValue={defaultMinimumScore}
          />
        </InputElement>
        <InputElement label="Minutes after publication">
          <input
            type="number"
            name="delay"
            id="delay"
            className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-sm sm:leading-6"
            min={15}
            max={1440}
            required
            defaultValue={defaultDelay}
          />
        </InputElement>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <InputElement label="Price Error">
          <div className="relative flex gap-x-3">
            <div className="flex h-6 items-center">
              <input
                id="price-error"
                name="price-error"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                defaultChecked={defaultPriceError}
              />
            </div>
            <div className="text-sm leading-6">
              <label htmlFor="allDeals" className="font-medium text-gray-900">
                All Deals with Price Errors
              </label>
            </div>
          </div>
        </InputElement>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <InputElement label="Cadence" fullWidth>
          <select
            id="cadence"
            name="cadence"
            className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:leading-6"
            required
            defaultValue={defaultCadence}
          >
            <option value="yesterday">
              Yesterday data (delivered at 8am current day)
            </option>
            <option value="today-1">
              Current day once (delivered at 1pm CET)
            </option>
            <option value="today-3">
              Current day 3-times (delivered at 9am, 1pm, 5pm)
            </option>
            <option value="burst">
              Deal Event Burst mode (delivered every 30 mins 24h)
            </option>
          </select>
        </InputElement>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <InputElement label="Incremental only">
          <div className="relative flex gap-x-3">
            <div className="flex h-6 items-center">
              <input
                id="incremental-only"
                name="incremental-only"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                defaultChecked={defaultIncrementalOnly}
              />
            </div>
            <div className="text-sm leading-6">
              <label htmlFor="allDeals" className="font-medium text-gray-900">
                Only new deals since last delivery are included in the report
              </label>
            </div>
          </div>
        </InputElement>

        <InputElement label="WhatsApp Notification">
          <div className="flex flex-col gap-4">
            <div className="relative flex gap-x-3">
              <div className="flex h-6 items-center">
                <input
                  id="whatsapp-notification-report"
                  name="whatsapp-notification-report"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  defaultChecked={defaultWhatsappNotificationReport}
                />
              </div>
              <div className="text-sm leading-6">
                <label htmlFor="allDeals" className="font-medium text-gray-900">
                  Get a notification when the report is ready
                </label>
              </div>
            </div>
            <div className="relative flex gap-x-3">
              <div className="flex h-6 items-center">
                <input
                  id="whatsapp-notification-single-deals"
                  name="whatsapp-notification-single-deals"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  defaultChecked={defaultWhatsappNotificationSingleDeals}
                />
              </div>
              <div className="text-sm leading-6">
                <label htmlFor="allDeals" className="font-medium text-gray-900">
                  Get a notification for every single deal
                </label>
              </div>
            </div>
          </div>
        </InputElement>
      </div>
      {formSubmitted && !success && (
        <div className="block my-6">
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Error</strong>
            <span className="block sm:inline pl-4">
              Something went wrong. Please try again later.
            </span>
          </div>
        </div>
      )}
      {formSubmitted && success && (
        <div className="block my-6">
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Success</strong>
            <span className="block sm:inline pl-4">
              Your preferences have been saved succesfully!
            </span>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-x-6">
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-8 py-3 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex"
          disabled={loading}
        >
          {loading && (
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          Save
        </button>
      </div>
    </form>
  );
};

export default NewFilterForm;
