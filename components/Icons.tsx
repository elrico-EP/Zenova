
import React from 'react';

export const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

export const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

export const CalendarDaysIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />
  </svg>
);

export const SyringeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M11.9999 1.5C11.6685 1.5 11.3999 1.76863 11.3999 2.1V9.5251L3.92484 17.0001C3.53432 17.3907 3.53432 18.0238 3.92484 18.4143L5.00002 19.4895C5.39055 19.88 6.02371 19.88 6.41424 19.4895L11.3999 14.5038V21.9C11.3999 22.2314 11.6685 22.5 11.9999 22.5C12.3313 22.5 12.5999 22.2314 12.5999 21.9V14.5038L17.5857 19.4895C17.9762 19.88 18.6093 19.88 19 19.4895L20.0751 18.4143C20.4657 18.0238 20.4657 17.3907 20.0751 17.0001L12.5999 9.5251V2.1C12.5999 1.76863 12.3313 1.5 11.9999 1.5Z" />
    </svg>
);
