import { useState, useEffect, useCallback } from 'react';
// FIX: Import the supabase client
import { supabase } from '../firebase/supabase-config';
import type { AppState, JornadaLaboral } from '../types';
import { INITIAL_NURSES } from '../constants';
import { agenda2026Data, INITIAL_STRASBOURG_ASSIGNMENTS_2026 } from '../data/agenda2026';

const INITIAL_JORNADAS: JornadaLaboral[] = [
  { id: 'j-tanja-1', nurseId: 'nurse-2', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'END_SHIFT_4H', reductionDayOfWeek: 3 },
  { id: 'j-virginie-1', nurseId: 'nurse-3', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'LEAVE_EARLY_1H_L_J' },
  { id: 'j-paola-1', nurseId: 'nurse-4', porcentaje: 80, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'FULL_DAY_OFF', reductionDayOfWeek: 1 },
  { id: 'j-elena-1', nurseId: 'nurse-5', porcentaje: 80, fechaInicio: '2026-03-01', fechaFin: '2026-09-30', reductionOption: 'FRIDAY_PLUS_EXTRA', secondaryReductionDayOfWeek: 2 },
  { id: 'j-katelijn-1', nurseId: 'nurse-8', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-06-30', reductionOption: 'END_SHIFT_4H', reductionDayOfWeek: 1 },
];

const JANUARY_2026_SHIFTS = {
    // ELVIO (nurse-1)
    'nurse-1': {
        '2026-01-05': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-06': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-07': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-08': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-09': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
        '2026-01-12': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-13': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-14': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-15': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-16': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
        '2026-01-19': 'STRASBOURG', '2026-01-20': 'STRASBOURG', '2026-01-21': 'STRASBOURG', '2026-01-22': 'STRASBOURG',
        '2026-01-26': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-27': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-28': { custom: 'MIMMS', type: 'FP', time: '8:00-17:00' },
        '2026-01-29': { custom: 'MIMMS', type: 'FP', time: '8:00-17:00' },
        '2026-01-30': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
    },
    // TANJA (nurse-2)
    'nurse-2': {
        '2026-01-05': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-06': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-07': { custom: 'Urg M (R)', type: 'URGENCES', time: '8:00-14:00' },
        '2026-01-08': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-09': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-01-12': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '10:00-18:30' },
        '2026-01-13': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-14': { custom: 'Urg M (R)', type: 'URGENCES', time: '8:00-13:00' },
        '2026-01-15': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '10:00-18:30' },
        '2026-01-16': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '12:00-17:45' },
        '2026-01-19': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-01-20': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-01-21': { custom: 'Urg M (R)', type: 'URGENCES', time: '8:00-14:00' },
        '2026-01-22': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-23': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-01-26': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '10:00-18:30' },
        '2026-01-27': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-28': { custom: 'Trav M (R)', type: 'TRAVAIL', time: '8:00-14:00' },
        '2026-01-29': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '10:00-18:30' },
        '2026-01-30': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
    },
    // VIRGINIE (nurse-3)
    'nurse-3': {
        '2026-01-05': { custom: 'Adm (R)', type: 'ADMIN', time: '8:00-16:00' },
        '2026-01-06': { custom: 'Trav M (R)', type: 'TRAVAIL', time: '8:00-16:00' },
        '2026-01-07': { custom: 'Trav M (R)', type: 'TRAVAIL', time: '8:00-16:00' },
        '2026-01-08': { custom: 'TW (R)', type: 'TW', time: '8:00-16:00' },
        '2026-01-09': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-01-12': { custom: 'Urg M (R)', type: 'URGENCES', time: '8:00-16:00' },
        '2026-01-13': { custom: 'Adm (R)', type: 'ADMIN', time: '8:00-16:00' },
        '2026-01-14': { custom: 'Trav M (R)', type: 'TRAVAIL', time: '8:00-16:00' },
        '2026-01-15': { custom: 'Urg M (R)', type: 'URGENCES', time: '8:00-16:00' },
        '2026-01-16': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-01-19': { custom: 'Urg M (R)', type: 'URGENCES', time: '8:00-16:00' },
        '2026-01-20': { custom: 'Urg T (R)', type: 'URGENCES_TARDE', time: '09:30-17:45' },
        '2026-01-21': { custom: 'Trav M (R)', type: 'TRAVAIL', time: '8:00-16:00' },
        '2026-01-22': { custom: 'Urg M (R)', type: 'URGENCES', time: '8:00-16:00' },
        '2026-01-23': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
        '2026-01-26': { custom: 'Trav M (R)', type: 'TRAVAIL', time: '8:00-16:00' },
        '2026-01-27': { custom: 'Adm (R)', type: 'ADMIN', time: '8:00-16:00' },
        '2026-01-28': { custom: 'MIMMS', type: 'FP', time: '8:00-17:00' },
        '2026-01-29': { custom: 'MIMMS', type: 'FP', time: '8:00-17:00' },
        '2026-01-30': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
    },
    // PAOLA (nurse-4)
    'nurse-4': {
        '2026-01-05': { custom: 'Reducción (80%)', type: 'CA' },
        '2026-01-06': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-01-07': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-08': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-09': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-12:30' },
        '2026-01-12': { custom: 'Reducción (80%)', type: 'CA' },
        '2026-01-13': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-01-14': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '10:00-18:30' },
        '2026-01-15': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-16': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-01-19': 'STRASBOURG', '2026-01-20': 'STRASBOURG', '2026-01-21': 'STRASBOURG', '2026-01-22': 'STRASBOURG',
        '2026-01-26': { custom: 'Reducción (80%)', type: 'CA' },
        '2026-01-27': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-28': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-29': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-30': { custom: 'FP', type: 'FP', time: '08:00-14:00' },
    },
    // ELENA (nurse-5)
    'nurse-5': {
        '2026-01-05': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-06': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-07': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-08': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-01-09': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
        '2026-01-12': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-13': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-01-14': { custom: 'Universidad', type: 'FP', time: '8:00-17:00' },
        '2026-01-15': { custom: 'Universidad', type: 'FP', time: '8:00-17:00' },
        '2026-01-16': { custom: 'Universidad', type: 'FP', time: '08:00-14:00' },
        '2026-01-19': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-20': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-21': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-22': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-23': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-01-26': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-27': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-28': { split: [{ custom: 'TW', type: 'TW', time: '08:00-13:00' }, { custom: 'STR travel', type: 'STRASBOURG', time: '16:00-21:30' }] },
        '2026-01-29': { custom: 'Euroscola', type: 'STRASBOURG' },
        '2026-01-30': { custom: 'STR travel', type: 'STRASBOURG', time: '08:00-14:00' },
    },
    // MIGUEL (nurse-6)
    'nurse-6': {
        '2026-01-05': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-06': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-07': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-01-08': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-09': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
        '2026-01-12': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-13': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-14': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-15': { custom: 'Adm', type: 'ADMIN', time: '8:00-14:00' },
        '2026-01-16': { custom: 'TW', type: 'TW', time: '08:00-14:00' },
        '2026-01-19': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-01-20': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-21': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-01-22': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-23': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-01-26': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-27': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-28': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '10:00-18:30' },
        '2026-01-29': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-01-30': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
    },
    // GORKA (nurse-7)
    'nurse-7': {
        '2026-01-05': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-01-06': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-07': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-08': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-01-09': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-01-12': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-01-13': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '10:00-18:30' },
        '2026-01-14': { custom: 'Adm', type: 'ADMIN', time: '10:00-18:30' },
        '2026-01-15': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-16': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '12:00-17:45' },
        '2026-01-19': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-20': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-21': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-22': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-01-23': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-01-26': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-27': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '10:00-18:30' },
        '2026-01-28': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-01-29': { custom: 'FP', type: 'FP', time: '8:00-17:00' },
        '2026-01-30': { custom: 'CA', type: 'CA', time: '08:00-14:00' },
    },
    // KATELIJN (nurse-8)
    'nurse-8': {
        '2026-01-05': { custom: 'Urg M (R)', type: 'URGENCES', time: '8:00-14:00' },
        '2026-01-06': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-07': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-01-08': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-09': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-01-12': { custom: 'Adm (R)', type: 'ADMIN', time: '8:00-14:00' },
        '2026-01-13': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-14': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-01-15': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-16': { custom: 'Sick', type: 'SICK_LEAVE', time: '08:00-14:00' },
        '2026-01-19': { custom: 'Urg M (R)', type: 'URGENCES', time: '8:00-14:00' },
        '2026-01-20': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-21': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-01-22': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-23': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-01-26': { custom: 'Adm (R)', type: 'ADMIN', time: '8:00-14:00' },
        '2026-01-27': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-28': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '10:00-18:30' },
        '2026-01-29': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-30': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
    },
    // JOSEPH (nurse-9)
    'nurse-9': {
        '2026-01-05': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-06': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-01-07': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-01-08': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-09': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-01-12': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-13': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '10:00-18:30' },
        '2026-01-14': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-15': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '10:00-18:30' },
        '2026-01-16': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-01-19': 'STRASBOURG', '2026-01-20': 'STRASBOURG', '2026-01-21': 'STRASBOURG', '2026-01-22': 'STRASBOURG',
        '2026-01-26': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-27': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-28': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-29': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-01-30': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
    },
    // TATIANA (nurse-10)
    'nurse-10': {
        '2026-01-05': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-01-06': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-07': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-01-08': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-09': { custom: 'TW', type: 'TW', time: '08:00-12:30' },
        '2026-01-12': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '10:00-18:30' },
        '2026-01-13': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-14': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-15': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-16': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-01-19': 'STRASBOURG', '2026-01-20': 'STRASBOURG', '2026-01-21': 'STRASBOURG',
        '2026-01-22': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-01-23': { custom: 'Euroscola', type: 'STRASBOURG' },
        '2026-01-26': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '10:00-18:30' },
        '2026-01-27': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '10:00-18:30' },
        '2026-01-28': { custom: 'MIMMS', type: 'FP', time: '8:00-17:00' },
        '2026-01-29': { custom: 'MIMMS', type: 'FP', time: '8:00-17:00' },
        '2026-01-30': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
    },
    // BECARIO (nurse-11)
    'nurse-11': {
        '2026-01-05': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-06': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-07': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-08': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-09': { custom: 'CA', type: 'CA', time: '08:00-14:00' },
        '2026-01-12': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-13': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-01-14': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-15': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-16': { custom: 'LIB', type: 'LIBERO', time: '10:00-16:00' },
        '2026-01-19': 'STRASBOURG', '2026-01-20': 'STRASBOURG', '2026-01-21': 'STRASBOURG',
        '2026-01-23': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-01-26': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-27': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-28': { custom: 'MIMMS', type: 'FP', time: '8:00-17:00' },
        '2026-01-29': { custom: 'MIMMS', type: 'FP', time: '8:00-17:00' },
        '2026-01-30': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
    },
};

const FEBRUARY_2026_SHIFTS = {
    // ELVIO (nurse-1)
    'nurse-1': {
        '2026-02-02': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-03': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-04': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-05': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-06': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
        '2026-02-09': 'STRASBOURG', '2026-02-10': 'STRASBOURG', '2026-02-11': 'STRASBOURG', '2026-02-12': 'STRASBOURG',
        '2026-02-16': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-17': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-18': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-19': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-02-20': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
        '2026-02-23': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-24': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-25': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-26': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-27': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
    },
    // TANJA (nurse-2)
    'nurse-2': {
        '2026-02-02': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-03': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-04': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
        '2026-02-05': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '10:00-18:30' },
        '2026-02-06': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-02-09': 'STRASBOURG', '2026-02-10': 'STRASBOURG', '2026-02-11': 'STRASBOURG', '2026-02-12': 'STRASBOURG',
        '2026-02-16': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-02-17': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-18': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-02-19': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-02-20': { custom: 'CA', type: 'CA', time: '08:00-14:00' },
        '2026-02-23': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-24': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '10:00-18:30' },
        '2026-02-25': { custom: 'Trav M (R)', type: 'TRAVAIL', time: '8:00-14:00' },
        '2026-02-26': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-27': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
    },
    // VIRGINIE (nurse-3)
    'nurse-3': {
        '2026-02-02': { custom: 'Trav T (R)', type: 'TRAVAIL_TARDE', time: '11:00-18:30' },
        '2026-02-03': { custom: 'Trav M (R)', type: 'TRAVAIL', time: '8:00-16:00' },
        '2026-02-04': { split: [{ custom: 'RECUP', type: 'RECUP', time: '08:00-12:00' }, { custom: 'ADMIN', type: 'ADMIN', time: '12:00-16:00' }] },
        '2026-02-05': { custom: 'Urg M', type: 'URGENCES', time: '8:00-16:00' },
        '2026-02-06': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-02-09': 'STRASBOURG', '2026-02-10': 'STRASBOURG', '2026-02-11': 'STRASBOURG', '2026-02-12': 'STRASBOURG',
        '2026-02-16': { custom: 'Urg T (R)', type: 'URGENCES_TARDE', time: '09:30-17:45' },
        '2026-02-17': { custom: 'Urg M (R)', type: 'URGENCES', time: '8:00-16:00' },
        '2026-02-18': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-16:00' },
        '2026-02-19': { custom: 'Urg M (R)', type: 'URGENCES', time: '8:00-16:00' },
        '2026-02-20': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-02-23': { custom: 'Trav M (R)', type: 'TRAVAIL', time: '8:00-16:00' },
        '2026-02-24': { custom: 'Adm', type: 'ADMIN', time: '8:00-16:00' },
        '2026-02-25': { custom: 'Trav M (R)', type: 'TRAVAIL', time: '8:00-16:00' },
        '2026-02-26': { custom: 'TW (R)', type: 'TW', time: '8:00-16:00' },
        '2026-02-27': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
    },
    // PAOLA (nurse-4)
    'nurse-4': {
        '2026-02-02': { custom: 'Reducción (80%)', type: 'CA' },
        '2026-02-03': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '10:00-18:30' },
        '2026-02-04': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-05': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-06': { custom: 'CA', type: 'CA', time: '08:00-14:00' },
        '2026-02-09': { custom: 'Reducción (80%)', type: 'CA' },
        '2026-02-10': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-11': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-02-12': { custom: 'Sick', type: 'SICK_LEAVE', time: '08:00-17:00' },
        '2026-02-13': { custom: 'Sick', type: 'SICK_LEAVE', time: '08:00-14:00' },
        '2026-02-16': { custom: 'Reducción (80%)', type: 'CA' },
        '2026-02-17': { custom: 'Sick', type: 'SICK_LEAVE', time: '08:00-17:00' },
        '2026-02-18': { custom: 'Sick', type: 'SICK_LEAVE', time: '08:00-17:00' },
        '2026-02-19': { custom: 'Sick', type: 'SICK_LEAVE', time: '08:00-17:00' },
        '2026-02-20': { custom: 'Sick', type: 'SICK_LEAVE', time: '08:00-14:00' },
        '2026-02-23': { custom: 'Reducción (80%)', type: 'CA' },
        '2026-02-24': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-25': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-02-26': { custom: 'Urg M', type: 'URGENCES', time: '8:00-16:00' },
        '2026-02-27': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
    },
    // ELENA (nurse-5)
    'nurse-5': {
        '2026-02-02': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '10:00-18:30' },
        '2026-02-03': { custom: 'FP', type: 'FP', time: '8:00-17:00' },
        '2026-02-04': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-02-05': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-06': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-02-09': { custom: 'Stage plaies', type: 'FP', time: '8:00-17:00' },
        '2026-02-10': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-11': { custom: 'Universidad', type: 'FP', time: '8:00-17:00' },
        '2026-02-12': { custom: 'Universidad', type: 'FP', time: '8:00-17:00' },
        '2026-02-13': { custom: 'Universidad', type: 'FP', time: '08:00-14:00' },
        '2026-02-16': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-17': { custom: 'BLS', type: 'FP', time: '8:00-17:00' },
        '2026-02-18': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-19': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-02-20': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-02-23': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-24': { custom: 'Stage plaies', type: 'FP', time: '8:00-17:00' },
        '2026-02-25': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-26': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-27': { custom: 'TW', type: 'TW', time: '08:00-14:00' },
    },
    // MIGUEL (nurse-6)
    'nurse-6': {
        '2026-02-02': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-03': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-04': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-05': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-06': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '12:00-17:45' },
        '2026-02-09': 'STRASBOURG', '2026-02-10': 'STRASBOURG', '2026-02-11': 'STRASBOURG', '2026-02-12': 'STRASBOURG',
        '2026-02-16': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-02-17': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-02-18': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-19': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-02-20': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-02-23': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '10:00-18:30' },
        '2026-02-24': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-25': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-26': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-27': { custom: 'TW', type: 'TW', time: '08:00-14:00' },
    },
    // GORKA (nurse-7)
    'nurse-7': {
        '2026-02-02': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-02-03': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-04': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '10:00-18:30' },
        '2026-02-05': { custom: 'STR travel', type: 'STRASBOURG' },
        '2026-02-06': { custom: 'Euroscola', type: 'STRASBOURG' },
        '2026-02-09': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-02-10': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-02-11': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-02-12': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-13': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-02-16': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-17': { custom: 'BLS', type: 'FP', time: '8:00-17:00' },
        '2026-02-18': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-02-19': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-02-20': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-02-23': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '10:00-18:30' },
        '2026-02-24': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-02-25': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-26': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-27': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
    },
    // KATELIJN (nurse-8)
    'nurse-8': {
        '2026-02-02': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-02-03': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-02-04': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-02-05': { custom: 'CS', type: 'CS', time: '8:00-17:00' },
        '2026-02-06': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-02-09': { custom: 'Trav M (R)', type: 'TRAVAIL', time: '8:00-14:00' },
        '2026-02-10': { custom: 'CS', type: 'CS', time: '8:00-17:00' },
        '2026-02-11': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-02-12': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-02-13': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-02-16': { custom: 'TW (R)', type: 'TW', time: '8:00-14:00' },
        '2026-02-17': { custom: 'BLS', type: 'FP', time: '8:00-17:00' },
        '2026-02-18': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-02-19': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-02-20': { custom: 'CA', type: 'CA', time: '08:00-14:00' },
        '2026-02-23': 'RECUP',
        '2026-02-24': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-25': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '10:00-18:30' },
        '2026-02-26': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-27': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
    },
    // JOSEPH (nurse-9)
    'nurse-9': {
        '2026-02-02': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-03': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '10:00-18:30' },
        '2026-02-04': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-05': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-06': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
        '2026-02-09': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '08:30-17:45' },
        '2026-02-10': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-11': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-12': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-13': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-02-16': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-17': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-02-18': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-19': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-20': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-02-23': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-02-24': { custom: 'CS', type: 'CS', time: '8:00-17:00' },
        '2026-02-25': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-26': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-27': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
    },
    // TATIANA (nurse-10)
    'nurse-10': {
        '2026-02-02': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-02-03': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-04': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-05': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '10:00-18:30' },
        '2026-02-06': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '12:00-17:45' },
        '2026-02-09': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-10': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-02-11': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-12': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-02-13': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-02-16': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-02-17': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-02-18': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-02-19': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-20': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-02-23': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-24': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '10:00-18:30' },
        '2026-02-25': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '10:00-18:30' },
        '2026-02-26': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-02-27': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
    },
    // BECARIO (nurse-11)
    'nurse-11': {
        '2026-02-02': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-03': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-04': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '10:00-18:30' },
        '2026-02-05': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-06': { custom: 'LIB', type: 'LIBERO', time: '10:00-16:00' },
        '2026-02-09': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-10': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-11': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-12': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-13': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-02-16': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-17': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-02-18': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-19': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-20': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
        '2026-02-23': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-24': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-02-25': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-02-26': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-02-27': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
    },
};

const mergeSchedules = (...schedules: any[]) => {
    const merged: any = {};
    for (const schedule of schedules) {
        for (const nurseId in schedule) {
            if (!merged[nurseId]) {
                merged[nurseId] = {};
            }
            Object.assign(merged[nurseId], schedule[nurseId]);
        }
    }
    return merged;
};

const getInitialState = (): AppState => ({
    nurses: INITIAL_NURSES,
    agenda: agenda2026Data,
    manualOverrides: mergeSchedules(JANUARY_2026_SHIFTS, FEBRUARY_2026_SHIFTS),
    notes: {
        '2026-01-05': { text: 'No PS no VAs', color: 'bg-yellow-100' },
        '2026-01-15': { text: 'Training day', color: 'bg-blue-100' },
    },
    vaccinationPeriod: { start: '2026-10-15', end: '2026-11-30' },
    strasbourgAssignments: INITIAL_STRASBOURG_ASSIGNMENTS_2026,
    strasbourgEvents: [],
    specialStrasbourgEvents: [],
    closedMonths: {},
    wishes: {},
    jornadasLaborales: INITIAL_JORNADAS,
    manualChangeLog: [],
    manualHours: {},
});

export const useSupabaseState = () => {
    const [data, setData] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let channel: any;

        const initData = async () => {
            console.log("🔥 Supabase: Cargando datos...");
            
            // Leer datos iniciales
            const { data: existingData, error } = await supabase
                .from('app_state')
                .select('data')
                .eq('id', 1)
                .single();

            if (error) {
                console.error("❌ Error al leer:", error);
                return;
            }

            if (!existingData?.data || Object.keys(existingData.data).length === 0) {
                console.log("💾 Inicializando datos...");
                const initialState = getInitialState();
                
                const { error: updateError } = await supabase
                    .from('app_state')
                    .update({ data: initialState })
                    .eq('id', 1);

                if (updateError) {
                    console.error("❌ Error al inicializar:", updateError);
                } else {
                    console.log("✅ Datos inicializados");
                    setData(initialState);
                }
            } else {
                console.log("✅ Datos cargados:", existingData.data);
                setData(existingData.data as AppState);
            }

            setLoading(false);

            // Escuchar cambios en tiempo real
            console.log("👂 Escuchando cambios en tiempo real...");
            channel = supabase
                .channel('app_state_changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'app_state',
                        filter: 'id=eq.1'
                    },
                    (payload) => {
                        console.log("📡 Cambio detectado:", payload);
                        if (payload.new && payload.new.data) {
                            setData(payload.new.data as AppState);
                        }
                    }
                )
                .subscribe();
        };

        initData();

        return () => {
            if (channel) {
                console.log("🔌 Desconectando listener...");
                supabase.removeChannel(channel);
            }
        };
    }, []);

    const updateData = useCallback(async (updates: Partial<AppState>) => {
        if (!data) return;

        const newData = { ...data, ...updates };
        console.log("💾 Guardando cambios...", updates);

        const { error } = await supabase
            .from('app_state')
            .update({ data: newData })
            .eq('id', 1);

        if (error) {
            console.error("❌ Error al guardar:", error);
        } else {
            console.log("✅ Guardado exitoso");
        }
    }, [data]);

    return { data, loading, updateData };
};