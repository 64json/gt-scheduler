import React, { useCallback, useContext, useState } from 'react';
import ReactTooltip from "react-tooltip";
import {
  faBan,
  faChair,
  faThumbtack,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { classes, periodToString } from '../../utils';
import { ActionRow } from '..';
import './stylesheet.scss';
import { OverlayCrnsContext, TermContext } from '../../contexts';
import { DELIVERY_MODES } from '../../constants';

export function Section({ className, section, pinned, color }) {
  const [{ term, pinnedCrns, excludedCrns }, { patchTermData }] = useContext(
    TermContext
  );
  const [, setOverlayCrns] = useContext(OverlayCrnsContext);
  const [seating, setSeating] = useState([[], []]);

  let hovering = false;
  const handleHover = () => {
    hovering = true;
    setTimeout(async () => {
      if (hovering)
        setSeating(await section.fetchSeating(term));
    }, 333);
  };

  const excludeSection = useCallback(
    (section) => {
      patchTermData({
        excludedCrns: [...excludedCrns, section.crn],
        pinnedCrns: pinnedCrns.filter((crn) => crn !== section.crn)
      });
    },
    [pinnedCrns, excludedCrns, patchTermData]
  );

  const pinSection = useCallback(
    (section) => {
      if (pinnedCrns.includes(section.crn)) {
        patchTermData({
          pinnedCrns: pinnedCrns.filter((crn) => crn !== section.crn)
        });
      } else {
        patchTermData({
          pinnedCrns: [...pinnedCrns, section.crn],
          excludedCrns: excludedCrns.filter((crn) => crn !== section.crn)
        });
      }
    },
    [pinnedCrns, excludedCrns, patchTermData]
  );

  return (
    <ActionRow
      label={section.id}
      className={classes('Section', className)}
      onMouseEnter={() => setOverlayCrns([section.crn])}
      onMouseLeave={() => setOverlayCrns([])}
      actions={[
        {
          icon: pinned ? faTimes : faThumbtack,
          onClick: () => pinSection(section)
        },
        {
          icon: faChair,
          dataTip: true,
          dataFor: section.id,
          onMouseEnter: () => { handleHover() },
          onMouseLeave: () => { hovering = false },
          href: `https://oscar.gatech.edu/pls/bprod/bwckschd.p_disp_detail_sched?term_in=${term}&crn_in=${section.crn}`
        },
        { icon: faBan, onClick: () => excludeSection(section) }
      ]}
      style={pinned ? { backgroundColor: color } : undefined}
    >
      <div className="section-details">
        <div className="delivery-mode">
          {DELIVERY_MODES[section.deliveryMode]}
        </div>
        <div className="meeting-container">
          {section.meetings.map((meeting, i) => {
            return (
              <div className="meeting" key={i}>
                <span className="days">{meeting.days.join('')}</span>
                <span className="period">{periodToString(meeting.period)}</span>
              </div>
            );
          })}
        </div>

        <ReactTooltip
          id={section.id}
          type="dark"
          place="right" 
          effect="solid"
          className="tooltip"
        >
            <table>
              <tbody>
                <tr>
                  <td><b>Seats Open</b></td>
                  <td>{seating[0].length === 0 ? `Loading...` :
                    typeof seating[0][1] === "number" ?
                      `${seating[0][0] - seating[0][1]} / ${seating[0][0]}` : `N/A`
                  }</td>
                </tr>
                <tr>
                  <td><b>Waitlist Open</b></td>
                  <td>{
                    seating[0].length === 0 ? `Loading...` :
                      typeof seating[0][1] === "number" ?
                        `${seating[0][2] - seating[0][3]} / ${seating[0][2]}` : `N/A`
                  }</td>
                </tr>
              </tbody>
            </table>
        </ReactTooltip>
      </div>
    </ActionRow>
  );
}
