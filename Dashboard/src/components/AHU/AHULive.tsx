import { useState } from 'react';
import { FaFan } from 'react-icons/fa';
import { GiValve, GiHotSurface, GiSnowflake2 } from 'react-icons/gi';
import { BiSolidSprayCan } from 'react-icons/bi';
import { ComponentBlock, HorizontalDuct, SensorBlock, VerticalSensorBlock } from './AHUComponents';
import type { RoomLayout } from '../../utils/types';
import { useTelemetry } from '../../utils/TelemetryContext';

export default function ScadaHVAC() {
    const { hvacData , actuators } = useTelemetry();
    const [sensors] = useState({
        room1: { temp: 23.0, hum: 55, co2: 600 },
    });

    const [controls] = useState({
        vavRoom1: 60,
        vavRoom2: 30,
    });

    const roomsLayout: RoomLayout[] = [
        {
            id: 'roomLeft', label: 'ROOM LEFT',
            temp: hvacData.roomLeft?.temp || 0, co2: hvacData.roomLeft?.co2 || 0, hum: hvacData.roomLeft?.hum || 0, valve: 0,
            colStart: 1, rowStart: 1, colSpan: 1, rowSpan: 1
        },
        {
            id: 'roomRight', label: 'ROOM RIGHT',
            temp: hvacData.roomRight?.temp || 0, co2: hvacData.roomRight?.co2 || 0, hum: hvacData.roomRight?.hum || 0, valve: 0,
            colStart: 2, rowStart: 1, colSpan: 1, rowSpan: 1
        }
    ];

    return (
        <div className="relative w-full rounded-xl p-4 py-4 shadow-2xl overflow-hidden mt-8 text-slate-500">

            {/* --- ROW 1: THE AHU & ENCLOSURE --- */}
            <div className="flex items-center w-full relative z-20 p-2">
                <SensorBlock
                    label="Outside Air"
                    temp={hvacData.ambient.temp}
                    hum={hvacData.ambient.hum}
                    co2={hvacData.ambient.co2}
                    width="max-w-48 w-full"
                    duct="bg-slate-600/50" // Neutral ambient air
                />
                {/* THE AHU BOX */}
                <div className="flex-5 h-48 border-4 border-slate-600/40 bg-slate-800/20 rounded-2xl relative flex items-center justify-between shadow-[inset_0_0_30px_rgba(0,0,0,0.2)]">
                    <span className="absolute z-30 -top-6 left-4 bg-slate-800/20 px-3 py-0.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest rounded border border-slate-600/40 shadow-md">
                        AIR HANDLING UNIT
                    </span>

                    {/* 1. Mix Damper */}
                    <ComponentBlock icon={GiValve} label="MIX DAMPER" controlValue={actuators?.intakeOpening} colorRing="text-slate-500" />

                    <SensorBlock
                        label="Mix Sensor"
                        temp={hvacData.economizer.temp}
                        hum={hvacData.economizer.hum}
                        pressure={hvacData.economizer.pressure}
                        co2={hvacData.economizer.co2}
                        duct="bg-slate-700/60" // Mixed transition air
                    />

                    {/* 2. Cooling Coil */}
                    <ComponentBlock icon={GiSnowflake2} label="COOL COIL" controlValue={actuators?.coolingCoil} colorRing="text-sky-400" isBooleanControl={true}/>

                    <SensorBlock
                        label="Cooler Sensor"
                        temp={hvacData.afterCooling.temp}
                        hum={hvacData.afterCooling.hum}
                        pressure={hvacData.afterCooling.pressure}
                        duct="bg-sky-900/40" // Cold air
                    />

                    {/* 3. Heating Coil */}
                    <ComponentBlock icon={GiHotSurface} label="HEAT COIL" controlValue={actuators?.heatingCoil} colorRing="text-red-400" isBooleanControl={true}/>

                    {/* Duct between heater and humidifier */}
                    <HorizontalDuct width="w-24" color="bg-red-900/30" />

                    <ComponentBlock icon={BiSolidSprayCan} label="HUMIDIFIER" controlValue={actuators?.humidifier} colorRing="text-cyan-400" isBooleanControl={true} />

                    <SensorBlock
                        label="Heater Sensor"
                        temp={hvacData.afterHeating.temp}
                        hum={hvacData.afterHeating.hum}
                        pressure={hvacData.afterHeating.pressure}
                        duct="bg-cyan-900/40" // Fully conditioned supply air
                    />

                    <ComponentBlock icon={FaFan} label="MAIN BLOWER" controlValue={actuators?.blower} colorRing="text-green-400" />
                </div>
            </div>

            {/* --- ROW 2: ROUTING (Return Air Up / Supply Air Down) --- */}
            <div className="flex items-center justify-between w-full relative h-28 z-10">
                <div className="max-w-60 w-full" />

                {/* Return Air dropping in */}
                <VerticalSensorBlock
                    label="Return Air"
                    temp={hvacData.return.temp}
                    hum={hvacData.return.hum}
                    co2={hvacData.return.co2}
                    duct="bg-red-900/20" // Stale return air
                />

                <div className="flex-1" />

                {/* Supply Air dropping down to zones */}
                <VerticalSensorBlock
                    label="Release Air"
                    temp={hvacData.releaseAir.temp}
                    hum={hvacData.releaseAir.hum}
                    co2={hvacData.releaseAir.co2}
                    flowrate={hvacData.releaseAir.flowrate}
                    duct="bg-cyan-900/40" // Conditioned supply air
                />

                <div className="max-w-10 w-full" />
            </div>

            {/* --- ROW 3: VAV ZONES ENCLOSURE --- */}
            <div className="w-full p-2 mt-2 border-4 border-slate-600/40 bg-slate-500/50 rounded-2xl relative shadow-[inset_0_0_30px_rgba(0,0,0,0.2)]">

                <span className="absolute z-30 -top-3 left-6 bg-[#1a2332] px-3 py-0.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest rounded border border-slate-600/40 shadow-md">
                    Facility
                </span>

                {/* Define the maximum width of your grid here (e.g., lg:grid-cols-3) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 relative z-20">

                    {roomsLayout.map((room) => (
                        <div
                            key={room.id}
                            style={{
                                gridColumnStart: room.colStart,
                                gridColumnEnd: room.colSpan ? `span ${room.colSpan}` : 'auto',
                                gridRowStart: room.rowStart,
                                gridRowEnd: room.rowSpan ? `span ${room.rowSpan}` : 'auto',
                            }}
                            className={`flex flex-col xl:flex-row items-center justify-center gap-4 p-4 rounded-2xl border shadow-lg relative ${room.isHub
                                ? 'bg-[#162235] border-cyan-900/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                                : 'bg-[#111827] border-slate-700'
                                }`}
                        >
                            <div className="h-48 flex flex-col xl:flex-row items-center justify-center gap-4">
                                <SensorBlock
                                    label={room.label}
                                    temp={room.temp}
                                    hum={room.hum}
                                    co2={room.co2}
                                    duct="bg-sky-900/40"
                                    showDuct={false}
                                />
                            </div>
                        </div>
                    ))}

                </div>
            </div>
        </div>
    );
}
