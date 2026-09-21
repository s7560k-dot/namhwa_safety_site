import { z } from 'zod';
import { BUDGET_ITEM_CODES } from '../config/constants';

/** 비목 코드 공통 스키마. budgetItem/expense 스키마가 함께 참조한다. */
export const BudgetItemCodeSchema = z.enum(BUDGET_ITEM_CODES);
