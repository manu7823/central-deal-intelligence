'use client';

import { NodeService } from '../utils/node-service';
import { useSupabase } from '@/app/supabase-provider';
import { TreeSelect, TreeSelectSelectionKeysType } from 'primereact/treeselect';
import { FormEvent, useEffect, useRef, useState } from 'react';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import { TreeNode } from 'primereact/treenode';
import { NotificationLimitService } from '@/utils/notification-limit-service';

const RegisterForm = () => {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [maxDeals, setMaxDeals] = useState(100);
  const [allCategories, setAllCategories] = useState<
    { slug: string; level: number }[]
  >([]);

  const [pushNotificationsFrequency, setPushNotificationsFrequency] =
    useState<number>(1);
  const [pushNotificationsChannel, setPushNotificationsChannel] =
    useState('whatsapp');

  const onPushNotificationsFrequencyChange = (value: string) => {
    setPushNotificationsFrequency(Number(value));
  };

  const onPushNotificationsChannelChange = (value: string) => {
    setPushNotificationsChannel(value);
  };

  const onChangeCategories = async (event: any) => {
    setSelectedCategoriesKeys(event.value);
  };

  const onChangeBrands = async (event: any) => {
    setSelectedBrandsKeys(event.value);
  };

  const getCategory = async (index: string, tree: any) => {
    const indexArray = index.split('-');
    let resultNode = tree[indexArray[0]];
    let resultNodeLevel = 1;

    for (let i = 1; i < indexArray.length; i++) {
      resultNode = resultNode.children[indexArray[i]];
      resultNodeLevel = i + 1;
    }

    return { slug: resultNode.data, level: resultNodeLevel };
  };

  const amazonAffiliateIdRef = useRef<HTMLInputElement>(null);
  const awinAffiliateIdRef = useRef<HTMLInputElement>(null);

  const [currentAffiliateProgram, setCurrentAffiliateProgram] =
    useState<string>('Amazon');

  const [affiliatePrograms, setAffiliatePrograms] = useState<
    { name: string; value: string }[]
  >([]);

  const onChangeAffiliateProgram = (event: FormEvent<HTMLSelectElement>) => {
    setCurrentAffiliateProgram(event.currentTarget.value);
  };

  const onAddAffiliateProgramAmazon = (event: FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setAffiliatePrograms([
      ...affiliatePrograms,
      {
        name: currentAffiliateProgram,
        value: amazonAffiliateIdRef.current?.value || ''
      }
    ]);
    if (amazonAffiliateIdRef.current !== null) {
      amazonAffiliateIdRef.current.value = '';
    }
  };

  const onAddAffiliateProgramAwin = (event: FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setAffiliatePrograms([
      ...affiliatePrograms,
      {
        name: currentAffiliateProgram,
        value: awinAffiliateIdRef.current?.value || ''
      }
    ]);
    if (awinAffiliateIdRef.current !== null) {
      awinAffiliateIdRef.current.value = '';
    }
  };

  const [categories, setCategories] = useState<TreeNode[]>([]);
  const [selectedCategoriesKeys, setSelectedCategoriesKeys] = useState<
    | string
    | TreeSelectSelectionKeysType
    | TreeSelectSelectionKeysType[]
    | null
    | undefined
  >(null);

  const [brands, setBrands] = useState<TreeNode[]>([]);
  const [selectedBrandsKeys, setSelectedBrandsKeys] = useState<
    | string
    | TreeSelectSelectionKeysType
    | TreeSelectSelectionKeysType[]
    | null
    | undefined
  >(null);

  useEffect(() => {
    NodeService.getTreeNodes().then((data) => {
      setCategories(data);
      setBrands(data);
    });
  }, []);

  useEffect(() => {
    transformCategories();
  }, [selectedCategoriesKeys, selectedBrandsKeys]);

  const transformCategories = async () => {
    // get selected categories
    const tree = await NodeService.getTreeNodes();
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
              const category = await getCategory(key, tree);
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
              const category = await getCategory(key, tree);
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
    const allCategories: { slug: string; level: number }[] = [];
    brandsAndCategories.forEach((item) => {
      if (
        !allCategories.some(
          (categoryOrBrand) => categoryOrBrand.slug === item.slug
        )
      ) {
        allCategories.push(item);
      }
    });

    setAllCategories(allCategories);
    console.log(allCategories);

    const updatedNotificationLimit =
      await NotificationLimitService.getNotificationLimit(allCategories);
    console.log(updatedNotificationLimit);
    setMaxDeals(updatedNotificationLimit);
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);

    const { data, error } = await supabase.auth.signUp({
      email: formData.get('email') as string,
      password: formData.get('password') as string
    });

    if (error) {
      setSuccess(false);
      setLoading(false);
      setFormSubmitted(true);
      throw new Error(error.message);
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          userId: data?.user?.id,
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          notificationFrequency: pushNotificationsFrequency,
          notificationChannel: pushNotificationsChannel,
          notificationAllDeals: formData.get('all-deals') == 'on',
          categories: JSON.stringify(allCategories),
          affiliatePrograms: JSON.stringify(affiliatePrograms)
        })
      });
      if (response.ok) {
        setSuccess(true);
        setLoading(false);
        setFormSubmitted(true);
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
      <div className="my-8 space-y-8 max-w-screen-md">
        <div className="border-b border-gray-900/10 pb-12">
          <h3 className="text-base font-semibold leading-7 text-gray-900">
            Personal Information
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Use a permanent address where you can receive mail.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                First name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  autoComplete="given-name"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder='John'
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Last name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  autoComplete="family-name"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder='Doe'
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder='john@doe.com'
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="phone"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Mobile Phone
              </label>
              <div className="mt-2">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="phone"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="+491234567890"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Please make sure your phone number starts with +49 and has no
                blank spaces.
              </p>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-12">
          <h3 className="text-base font-semibold leading-7 text-gray-900">
            Affiliate Programs
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            To start, all you need is an account with the Amazon Associates
            Program and/ or AWIN to monetize the links we will send you.{' '}
            <br></br> We will automatically add your account-ID to the links we
            send you, so you can post them right away.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            {affiliatePrograms.map((affiliateProgram, idx) => (
              <>
                <div className="sm:col-span-2 ">
                  <input
                    id={`affiliateProgram${idx}`}
                    name={`affiliateProgram${idx}`}
                    autoComplete="affiliateProgram"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-400 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                    disabled
                    value={affiliateProgram.name}
                  />
                </div>
                <div className="sm:col-span-3 flex items-end">
                  <input
                    id={`affiliateId${idx}`}
                    name="affiliateId"
                    type="text"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-400 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    disabled
                    value={affiliateProgram.value}
                  />
                </div>
              </>
            ))}
            <div className="sm:col-span-2">
              <select
                id="affiliateProgram"
                name="affiliateProgram"
                autoComplete="affiliateProgram"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                onChange={onChangeAffiliateProgram}
              >
                <option>Amazon</option>
                <option>AWIN</option>
              </select>
            </div>

            {currentAffiliateProgram == 'Amazon' ? (
              <>
                <div className="sm:col-span-3 flex items-end">
                  <input
                    ref={amazonAffiliateIdRef}
                    id="affiliateIdAmazon"
                    name="affiliateIdAmazon"
                    type="text"
                    placeholder="Affiliate ID"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
                <div className="sm:col-span-1 items-end flex">
                  <button
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={onAddAffiliateProgramAmazon}
                  >
                    Add
                  </button>
                </div>
              </>
            ) : null}
            {currentAffiliateProgram == 'AWIN' ? (
              <>
                <div className="sm:col-span-3 flex items-end">
                  <input
                    ref={awinAffiliateIdRef}
                    id="affiliateIdAwin"
                    name="affiliateIdAwin"
                    type="text"
                    placeholder="Affiliate ID"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
                <div className="sm:col-span-1 items-end flex">
                  <button
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={onAddAffiliateProgramAwin}
                  >
                    Add
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-12">
          <h3 className="text-base font-semibold leading-7 text-gray-900">
            Category and Brand Preferences
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Select the categories and brands you are interested in.
          </p>

          <p className="text-sm font-semibold leading-6 text-gray-900 mt-10">
            Categories
          </p>
          <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="card flex justify-content-center w-100 col-span-full">
              <TreeSelect
                value={selectedCategoriesKeys}
                onChange={onChangeCategories}
                options={categories}
                metaKeySelection={false}
                className="md:w-20rem w-full border border-gray-300 rounded-md"
                selectionMode="checkbox"
                display="chip"
                placeholder="Select Categories"
                filter
              />
            </div>
          </div>
          <p className="text-sm font-semibold leading-6 text-gray-900 mt-10">
            Brands
          </p>
          <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="card flex justify-content-center w-100 col-span-full">
              <TreeSelect
                value={selectedBrandsKeys}
                onChange={onChangeBrands}
                options={brands}
                metaKeySelection={false}
                className="md:w-20rem w-full border border-gray-300 rounded-md"
                selectionMode="checkbox"
                display="chip"
                placeholder="Select Brands"
                filter
              />
            </div>
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-12">
          <h3 className="text-base font-semibold leading-7 text-gray-900">
            Notifications
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Set your notifications preferences.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <fieldset className="col-span-full">
              <legend className="text-sm font-semibold leading-6 text-gray-900">
                Frequency
              </legend>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                How many deal notifications do you want to receive per day?
              </p>
              <div className="relative my-6 mb-2">
                <span className="text-xl">
                  ~ {pushNotificationsFrequency} per Day
                </span>
              </div>
              <div className="relative my-6 mb-20">
                <label htmlFor="labels-range-input" className="sr-only">
                  Labels range
                </label>
                <input
                  id="labels-range-input"
                  type="range"
                  min="1"
                  max={maxDeals}
                  defaultValue={maxDeals}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:ring-indigo-300 focus:ring-1 accent-indigo-600"
                  onChange={(e) =>
                    onPushNotificationsFrequencyChange(e.target.value)
                  }
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 absolute start-0 -bottom-6">
                  ~ 1 per Day
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 absolute end-0 -bottom-6">
                  ~ {maxDeals} per Day
                </span>
              </div>
            </fieldset>

            <fieldset className="col-span-full">
              <legend className="text-sm font-semibold leading-6 text-gray-900">
                Channel
              </legend>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                These are delivered via WhatsApp to your mobile phone or via
                email.
              </p>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-x-3">
                  <input
                    id="pushWhatsapp"
                    name="push-notifications-channel"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    checked={pushNotificationsChannel === 'whatsapp'}
                    onChange={() =>
                      onPushNotificationsChannelChange('whatsapp')
                    }
                  />
                  <label
                    htmlFor="pushWhatsapp"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    WhatsApp
                  </label>
                </div>
                <div className="flex items-center gap-x-3">
                  <input
                    id="pushEmail"
                    name="push-notifications-channel"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    checked={pushNotificationsChannel === 'email'}
                    onChange={() => onPushNotificationsChannelChange('email')}
                    disabled
                  />
                  <label
                    htmlFor="pushEmail"
                    className="block text-sm font-medium leading-6 text-gray-300"
                  >
                    Email
                  </label>
                </div>
              </div>
            </fieldset>

            <fieldset className="col-span-full">
              <legend className="text-sm font-semibold leading-6 text-gray-900">
                All Deals
              </legend>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Get notified when a new deal is posted, regardless of your
                affiliate program preferences.
              </p>
              <div className="mt-6 space-y-6">
                <div className="relative flex gap-x-3">
                  <div className="flex h-6 items-center">
                    <input
                      id="allDeals"
                      name="all-deals"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label
                      htmlFor="allDeals"
                      className="font-medium text-gray-900"
                    >
                      All Deals notifications
                    </label>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
        </div>

        <div>
          <p className="mt-1 leading-6 text-gray-600">
            By signing up you agree to the{' '}
            <a href="/service-agreement" className="text-indigo-600">
              Closed Beta Service Agreement
            </a>
            .
          </p>
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
                You are signed up successfully
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-x-6">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-8 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex"
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
            Sign up
          </button>
        </div>

        <div>
          <p className="mt-6 text leading-6 text-gray-600">
            Thanks so much for helping to improve our service.
          </p>
          <p className="mt-6 text leading-6 text-gray-600">
            Please send any feedback to:{' '}
            <a href="mailto:team@omg-ecom.com" className="text-indigo-600">
              team@omg-ecom.com
            </a>
          </p>
          <p className="mt-6 text leading-6 text-gray-600">Have a nice day.</p>
        </div>
      </div>
    </form>
  );
};

export default RegisterForm;
