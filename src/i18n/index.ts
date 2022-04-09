// Code from https://github.com/valentine195/obsidian-admonition/blob/master/src/lang/helpers.ts

import {moment} from 'obsidian';
import en from './locales/en';
import zhCN from './locales/zh-cn';

const localeMap: {[k: string]: Partial<typeof en>} = {
  en,
  'zh-cn': zhCN,
};

const locale = localeMap[moment.locale()];

export default function t(str: keyof typeof en): string {
  return (locale && locale[str]) || en[str];
}