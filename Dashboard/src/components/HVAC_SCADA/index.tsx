import { FaFan } from 'react-icons/fa';
import { GiValve, GiHotSurface, GiSnowflake2 } from 'react-icons/gi';
import { BiSolidSprayCan } from 'react-icons/bi';
import { ComponentBlock, HorizontalDuct, SensorBlock, VerticalSensorBlock, VAVBox } from './AHUComponents';
import type { RoomLayout } from '../../utils/types';
import { useTelemetry } from '../../utils/TelemetryContext';

export default function HVAC_SCADA() {
    const { systemData } = useTelemetry();

    const roomsLayout: RoomLayout[] = [
        {
            id: 'roomLeft', label: 'ROOM LEFT',
            temp: systemData.room1_sensor1?.t || 0, co2: systemData.room1_sensor1?.c || 0, hum: systemData.room1_sensor1?.h || 0, valve: 0,
            colStart: 1, rowStart: 1, colSpan: 1, rowSpan: 1
        },
        {
            id: 'roomRight', label: 'ROOM RIGHT',
            temp: systemData.room1_sensor2?.t || 0, co2: systemData.room1_sensor2?.c || 0, hum: systemData.room1_sensor2?.h || 0, valve: 0,
            colStart: 2, rowStart: 1, colSpan: 1, rowSpan: 1
        }
    ];

    return (
        <div className="relative w-full rounded-xl p-4 py-4 shadow-2xl overflow-hidden mt-8 text-slate-500">

            {/* --- ROW 1: THE AHU & ENCLOSURE --- */}
            <div className="flex items-center w-full relative z-20 p-2">
                <SensorBlock
                    label="Outside Air"
                    temp={systemData.outside.t}
                    hum={systemData.outside.h}
                    co2={systemData.outside.c}
                    width="max-w-48 w-full"
                    duct="bg-slate-600/50" // Neutral ambient air
                />
                {/* THE AHU BOX */}
                <div className="flex-5 h-48 border-4 border-slate-600/40 bg-slate-800/20 rounded-2xl relative flex items-center justify-between shadow-[inset_0_0_30px_rgba(0,0,0,0.2)]">
                    <span className="absolute z-30 -top-6 left-4 bg-slate-800/20 px-3 py-0.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest rounded border border-slate-600/40 shadow-md">
                        AIR HANDLING UNIT
                    </span>

                    {/* 1. Mix Damper */}
                    <ComponentBlock icon={GiValve} label="MIX DAMPER" controlValue={systemData.mixer} colorRing="text-slate-500" />

                    <SensorBlock
                        label="Mix Sensor"
                        temp={systemData.mixed.t}
                        hum={systemData.mixed.h}
                        pressure={systemData.mixed.p}
                        // co2={systemData.mixed.c}
                        duct="bg-slate-700/60" // Mixed transition air
                    />

                    {/* 2. Cooling Coil */}
                    <ComponentBlock icon={GiSnowflake2} label="COOL COIL" controlValue={systemData.coolerState} colorRing="text-sky-400" isBooleanControl={true} />

                    <SensorBlock
                        label="Cooler Sensor"
                        temp={systemData.cooler.t}
                        hum={systemData.cooler.h}
                        pressure={systemData.cooler.p}
                        duct="bg-sky-900/40" // Cold air
                    />

                    {/* 3. Heating Coil */}
                    <ComponentBlock icon={GiHotSurface} label="HEAT COIL" controlValue={systemData.heaterState} colorRing="text-red-400" isBooleanControl={true} />

                    {/* Duct between heater and humidifier */}
                    <HorizontalDuct width="w-24" color="bg-red-900/30" />

                    <ComponentBlock icon={BiSolidSprayCan} label="HUMIDIFIER" controlValue={systemData.humidifierState} colorRing="text-cyan-400" isBooleanControl={true} />

                    <SensorBlock
                        label="Heater Sensor"
                        temp={systemData.heated.t}
                        hum={systemData.heated.h}
                        pressure={systemData.heated.p}
                        duct="bg-cyan-900/40" // Fully conditioned supply air
                    />

                    <ComponentBlock icon={FaFan} label="MAIN BLOWER" controlValue={systemData.fan} colorRing="text-green-400" />
                </div>
            </div>

            {/* --- ROW 2: ROUTING (Return Air Up / Supply Air Down) --- */}
            <div className="flex items-center justify-between w-full relative h-36 z-10">
                <div className="max-w-60 w-full" />

                {/* Return Air dropping in */}
                <VerticalSensorBlock
                    label="Return Air"
                    temp={systemData.return.t}
                    hum={systemData.return.h}
                    co2={systemData.return.c}
                    duct="bg-red-900/20" // Stale return air
                />

                <div className="flex-1" />

                {/* Supply Air dropping down to zones */}
                <VerticalSensorBlock
                    label="Release Air"
                    temp={systemData.supply.t}
                    hum={systemData.supply.h}
                    co2={systemData.supply.c}
                    duct="bg-cyan-900/40" // Conditioned supply air
                />

                <div className="max-w-10 w-full" />
            </div>

            {/* --- ROW 3: VAV ZONES ENCLOSURE --- */}
            <div className="w-full p-2 mt-2 border-4 border-slate-600/40 bg-slate-500/50 rounded-2xl relative shadow-[inset_0_0_30px_rgba(0,0,0,0.2)]">

                <span className="absolute z-30 -top-3 left-6 bg-[#1a2332] px-3 py-0.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest rounded border border-slate-600/40 shadow-md">
                    Cool Room
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
                            className={`flex h-40 flex-col xl:flex-row items-center justify-center gap-4 rounded-2xl border shadow-lg relative ${room.isHub
                                ? 'bg-[#162235] border-cyan-900/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                                : 'bg-[#111827] border-slate-700'
                                }`}
                        >
                            <div className="h-36 -mt-6 flex flex-col xl:flex-row items-center justify-center">
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


                    <VAVBox actualFlow={systemData.flowrate} setpointFlow={0} />

                </div>
            </div>
        </div>
    );
}
