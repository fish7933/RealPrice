import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FreightContextType } from '@/types/freight';
import { useAuth } from './AuthContext';

// Import loaders
import * as loaders from './freight/freightLoaders';

// Import helpers
import * as helpers from './freight/freightHelpers';

// Import calculations
import { calculateCost } from './freight/freightCalculations';

// Import operations
import * as ops from './freight/freightOperations';
import * as opsExt from './freight/freightOperationsExtended';

const FreightContext = createContext<FreightContextType | undefined>(undefined);

export const FreightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // State management
  const [shippingLines, setShippingLines] = useState<FreightContextType['shippingLines']>([]);
  const [ports, setPorts] = useState<FreightContextType['ports']>([]);
  const [railAgents, setRailAgents] = useState<FreightContextType['railAgents']>([]);
  const [truckAgents, setTruckAgents] = useState<FreightContextType['truckAgents']>([]);
  const [destinations, setDestinations] = useState<FreightContextType['destinations']>([]);
  const [seaFreights, setSeaFreights] = useState<FreightContextType['seaFreights']>([]);
  const [agentSeaFreights, setAgentSeaFreights] = useState<FreightContextType['agentSeaFreights']>([]);
  const [dthcList, setDthcList] = useState<FreightContextType['dthcList']>([]);
  const [dpCosts, setDpCosts] = useState<FreightContextType['dpCosts']>([]);
  const [combinedFreights, setCombinedFreights] = useState<FreightContextType['combinedFreights']>([]);
  const [portBorderFreights, setPortBorderFreights] = useState<FreightContextType['portBorderFreights']>([]);
  const [borderDestinationFreights, setBorderDestinationFreights] = useState<FreightContextType['borderDestinationFreights']>([]);
  const [weightSurchargeRules, setWeightSurchargeRules] = useState<FreightContextType['weightSurchargeRules']>([]);
  const [calculationHistory, setCalculationHistory] = useState<FreightContextType['calculationHistory']>([]);
  const [quotations, setQuotations] = useState<FreightContextType['quotations']>([]);
  const [auditLogs, setAuditLogs] = useState<FreightContextType['auditLogs']>([]);
  const [borderCities, setBorderCities] = useState<FreightContextType['borderCities']>([]);
  const [systemSettings, setSystemSettings] = useState<FreightContextType['systemSettings']>([]);

  // Load functions with callbacks
  const loadShippingLines = useCallback(async () => {
    const data = await loaders.loadShippingLines();
    setShippingLines(data);
  }, []);

  const loadPorts = useCallback(async () => {
    const data = await loaders.loadPorts();
    setPorts(data);
  }, []);

  const loadRailAgents = useCallback(async () => {
    const data = await loaders.loadRailAgents();
    setRailAgents(data);
  }, []);

  const loadTruckAgents = useCallback(async () => {
    const data = await loaders.loadTruckAgents();
    setTruckAgents(data);
  }, []);

  const loadDestinations = useCallback(async () => {
    const data = await loaders.loadDestinations();
    setDestinations(data);
  }, []);

  const loadSeaFreights = useCallback(async () => {
    const data = await loaders.loadSeaFreights();
    setSeaFreights(data);
  }, []);

  const loadAgentSeaFreights = useCallback(async () => {
    const data = await loaders.loadAgentSeaFreights();
    setAgentSeaFreights(data);
  }, []);

  const loadDTHC = useCallback(async () => {
    const data = await loaders.loadDTHC();
    setDthcList(data);
  }, []);

  const loadDPCosts = useCallback(async () => {
    const data = await loaders.loadDPCosts();
    setDpCosts(data);
  }, []);

  const loadCombinedFreights = useCallback(async () => {
    const data = await loaders.loadCombinedFreights();
    setCombinedFreights(data);
  }, []);

  const loadPortBorderFreights = useCallback(async () => {
    const data = await loaders.loadPortBorderFreights();
    setPortBorderFreights(data);
  }, []);

  const loadBorderDestinationFreights = useCallback(async () => {
    const data = await loaders.loadBorderDestinationFreights();
    setBorderDestinationFreights(data);
  }, []);

  const loadWeightSurchargeRules = useCallback(async () => {
    const data = await loaders.loadWeightSurchargeRules();
    setWeightSurchargeRules(data);
  }, []);

  const loadCalculationHistory = useCallback(async () => {
    const data = await loaders.loadCalculationHistory();
    setCalculationHistory(data);
  }, []);

  const loadQuotations = useCallback(async () => {
    const data = await loaders.loadQuotations();
    setQuotations(data);
  }, []);

  const loadAuditLogs = useCallback(async () => {
    const data = await loaders.loadAuditLogs();
    setAuditLogs(data);
  }, []);

  const loadBorderCities = useCallback(async () => {
    const data = await loaders.loadBorderCities();
    setBorderCities(data);
  }, []);

  const loadSystemSettings = useCallback(async () => {
    const data = await loaders.loadSystemSettings();
    setSystemSettings(data);
  }, []);

  // Load all data on mount
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadShippingLines(),
        loadPorts(),
        loadQuotations(),
        loadRailAgents(),
        loadTruckAgents(),
        loadDestinations(),
        loadSeaFreights(),
        loadAgentSeaFreights(),
        loadDTHC(),
        loadDPCosts(),
        loadCombinedFreights(),
        loadPortBorderFreights(),
        loadBorderDestinationFreights(),
        loadWeightSurchargeRules(),
        loadCalculationHistory(),
        loadAuditLogs(),
        loadBorderCities(),
        loadSystemSettings(),
      ]);
    };

    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CRUD Operations - Shipping Lines
  const addShippingLine: FreightContextType['addShippingLine'] = async (line) => {
    await ops.addShippingLine(line);
    await loadShippingLines();
  };

  const updateShippingLine: FreightContextType['updateShippingLine'] = async (id, line) => {
    await ops.updateShippingLine(id, line);
    await loadShippingLines();
  };

  const deleteShippingLine: FreightContextType['deleteShippingLine'] = async (id) => {
    await ops.deleteShippingLine(id);
    await loadShippingLines();
  };

  const getShippingLineById: FreightContextType['getShippingLineById'] = (id) => {
    return shippingLines.find((l) => l.id === id);
  };

  // CRUD Operations - Ports
  const addPort: FreightContextType['addPort'] = async (port) => {
    await ops.addPort(port);
    await loadPorts();
  };

  const updatePort: FreightContextType['updatePort'] = async (id, port) => {
    await ops.updatePort(id, port);
    await loadPorts();
  };

  const deletePort: FreightContextType['deletePort'] = async (id) => {
    await ops.deletePort(id);
    await loadPorts();
  };

  const getPortById: FreightContextType['getPortById'] = (id) => {
    return ports.find((p) => p.id === id);
  };

  // CRUD Operations - Rail Agents
  const addRailAgent: FreightContextType['addRailAgent'] = async (agent) => {
    await ops.addRailAgent(agent);
    await loadRailAgents();
  };

  const updateRailAgent: FreightContextType['updateRailAgent'] = async (id, agent) => {
    await ops.updateRailAgent(id, agent);
    await loadRailAgents();
  };

  const deleteRailAgent: FreightContextType['deleteRailAgent'] = async (id) => {
    await ops.deleteRailAgent(id);
    await loadRailAgents();
    await loadAgentSeaFreights();
    await loadDTHC();
    await loadCombinedFreights();
    await loadPortBorderFreights();
  };

  const getRailAgentById: FreightContextType['getRailAgentById'] = (id) => {
    return railAgents.find((a) => a.id === id);
  };

  // CRUD Operations - Truck Agents
  const addTruckAgent: FreightContextType['addTruckAgent'] = async (agent) => {
    await ops.addTruckAgent(agent);
    await loadTruckAgents();
  };

  const updateTruckAgent: FreightContextType['updateTruckAgent'] = async (id, agent) => {
    await ops.updateTruckAgent(id, agent);
    await loadTruckAgents();
  };

  const deleteTruckAgent: FreightContextType['deleteTruckAgent'] = async (id) => {
    await ops.deleteTruckAgent(id);
    await loadTruckAgents();
    await loadBorderDestinationFreights();
    await loadWeightSurchargeRules();
  };

  const getTruckAgentById: FreightContextType['getTruckAgentById'] = (id) => {
    return truckAgents.find((a) => a.id === id);
  };

  // CRUD Operations - Destinations
  const addDestination: FreightContextType['addDestination'] = async (destination) => {
    await ops.addDestination(destination);
    await loadDestinations();
  };

  const updateDestination: FreightContextType['updateDestination'] = async (id, destination) => {
    await ops.updateDestination(id, destination);
    await loadDestinations();
  };

  const deleteDestination: FreightContextType['deleteDestination'] = async (id) => {
    await ops.deleteDestination(id);
    await loadDestinations();
    await loadBorderDestinationFreights();
    await loadCombinedFreights();
  };

  const getDestinationById: FreightContextType['getDestinationById'] = (id) => {
    return destinations.find((d) => d.id === id);
  };

  // CRUD Operations - Sea Freights
  const addSeaFreight: FreightContextType['addSeaFreight'] = async (freight) => {
    await ops.addSeaFreight(freight, seaFreights, user);
    await loadSeaFreights();
  };

  const updateSeaFreight: FreightContextType['updateSeaFreight'] = async (id, freight) => {
    await ops.updateSeaFreight(id, freight, seaFreights, user);
    await loadSeaFreights();
  };

  const deleteSeaFreight: FreightContextType['deleteSeaFreight'] = async (id) => {
    await ops.deleteSeaFreight(id, seaFreights, user);
    await loadSeaFreights();
  };

  const getSeaFreightOptions: FreightContextType['getSeaFreightOptions'] = (pol, pod, date) => {
    return helpers.getSeaFreightOptions(seaFreights, pol, pod, date);
  };

  const getSeaFreightVersion: FreightContextType['getSeaFreightVersion'] = (carrier, pol, pod, excludeId) => {
    return helpers.getSeaFreightVersion(seaFreights, carrier, pol, pod, excludeId);
  };

  // CRUD Operations - Agent Sea Freights
  const addAgentSeaFreight: FreightContextType['addAgentSeaFreight'] = async (freight) => {
    await ops.addAgentSeaFreight(freight, agentSeaFreights, user);
    await loadAgentSeaFreights();
  };

  const updateAgentSeaFreight: FreightContextType['updateAgentSeaFreight'] = async (id, freight) => {
    await ops.updateAgentSeaFreight(id, freight, agentSeaFreights, user);
    await loadAgentSeaFreights();
  };

  const deleteAgentSeaFreight: FreightContextType['deleteAgentSeaFreight'] = async (id) => {
    await ops.deleteAgentSeaFreight(id, agentSeaFreights, user);
    await loadAgentSeaFreights();
  };

  const getAgentSeaFreight: FreightContextType['getAgentSeaFreight'] = (agent, pol, pod, date) => {
    return helpers.getAgentSeaFreight(agentSeaFreights, agent, pol, pod, date);
  };

  const getAgentSeaFreightVersion: FreightContextType['getAgentSeaFreightVersion'] = (agent, pol, pod, excludeId) => {
    return helpers.getAgentSeaFreightVersion(agentSeaFreights, agent, pol, pod, excludeId);
  };

  // CRUD Operations - DTHC
  const addDTHC: FreightContextType['addDTHC'] = async (dthc) => {
    await opsExt.addDTHC(dthc, user);
    await loadDTHC();
  };

  const updateDTHC: FreightContextType['updateDTHC'] = async (id, dthc) => {
    await opsExt.updateDTHC(id, dthc, dthcList, user);
    await loadDTHC();
  };

  const deleteDTHC: FreightContextType['deleteDTHC'] = async (id) => {
    await opsExt.deleteDTHC(id, dthcList, user);
    await loadDTHC();
  };

  const getDTHCByAgentAndRoute: FreightContextType['getDTHCByAgentAndRoute'] = (agent, pol, pod, date) => {
    return helpers.getDTHCByAgentAndRoute(dthcList, agent, pol, pod, date);
  };

  // CRUD Operations - DP Costs
  const addDPCost: FreightContextType['addDPCost'] = async (dp) => {
    await opsExt.addDPCost(dp, user);
    await loadDPCosts();
  };

  const updateDPCost: FreightContextType['updateDPCost'] = async (id, dp) => {
    await opsExt.updateDPCost(id, dp, dpCosts, user);
    await loadDPCosts();
  };

  const deleteDPCost: FreightContextType['deleteDPCost'] = async (id) => {
    await opsExt.deleteDPCost(id, dpCosts, user);
    await loadDPCosts();
  };

  const getDPCost: FreightContextType['getDPCost'] = (port, date) => {
    return helpers.getDPCost(dpCosts, port, date);
  };

  // CRUD Operations - Combined Freights
  const addCombinedFreight: FreightContextType['addCombinedFreight'] = async (freight) => {
    await opsExt.addCombinedFreight(freight, user);
    await loadCombinedFreights();
  };

  const updateCombinedFreight: FreightContextType['updateCombinedFreight'] = async (id, freight) => {
    await opsExt.updateCombinedFreight(id, freight, combinedFreights, user);
    await loadCombinedFreights();
  };

  const deleteCombinedFreight: FreightContextType['deleteCombinedFreight'] = async (id) => {
    await opsExt.deleteCombinedFreight(id, combinedFreights, user);
    await loadCombinedFreights();
  };

  const getCombinedFreight: FreightContextType['getCombinedFreight'] = (agent, pod, destinationId, date) => {
    return helpers.getCombinedFreight(combinedFreights, agent, pod, destinationId, date);
  };

  // CRUD Operations - Port Border Freights
  const addPortBorderFreight: FreightContextType['addPortBorderFreight'] = async (freight) => {
    await opsExt.addPortBorderFreight(freight, user);
    await loadPortBorderFreights();
  };

  const updatePortBorderFreight: FreightContextType['updatePortBorderFreight'] = async (id, freight) => {
    await opsExt.updatePortBorderFreight(id, freight, portBorderFreights, user);
    await loadPortBorderFreights();
  };

  const deletePortBorderFreight: FreightContextType['deletePortBorderFreight'] = async (id) => {
    await opsExt.deletePortBorderFreight(id, portBorderFreights, user);
    await loadPortBorderFreights();
  };

  const getPortBorderRate: FreightContextType['getPortBorderRate'] = (agent, pod, date) => {
    return helpers.getPortBorderRate(portBorderFreights, agent, pod, date);
  };

  // CRUD Operations - Border Destination Freights
  const addBorderDestinationFreight: FreightContextType['addBorderDestinationFreight'] = async (freight) => {
    await opsExt.addBorderDestinationFreight(freight, user);
    await loadBorderDestinationFreights();
  };

  const updateBorderDestinationFreight: FreightContextType['updateBorderDestinationFreight'] = async (id, freight) => {
    await opsExt.updateBorderDestinationFreight(id, freight, borderDestinationFreights, user);
    await loadBorderDestinationFreights();
  };

  const deleteBorderDestinationFreight: FreightContextType['deleteBorderDestinationFreight'] = async (id) => {
    await opsExt.deleteBorderDestinationFreight(id, borderDestinationFreights, user);
    await loadBorderDestinationFreights();
  };

  const getBorderDestinationRate: FreightContextType['getBorderDestinationRate'] = (agent, destinationId, date) => {
    return helpers.getBorderDestinationRate(borderDestinationFreights, agent, destinationId, date);
  };

  // CRUD Operations - Weight Surcharge Rules
  const addWeightSurchargeRule: FreightContextType['addWeightSurchargeRule'] = async (rule) => {
    await opsExt.addWeightSurchargeRule(rule, user);
    await loadWeightSurchargeRules();
  };

  const updateWeightSurchargeRule: FreightContextType['updateWeightSurchargeRule'] = async (id, rule) => {
    await opsExt.updateWeightSurchargeRule(id, rule, weightSurchargeRules, user);
    await loadWeightSurchargeRules();
  };

  const deleteWeightSurchargeRule: FreightContextType['deleteWeightSurchargeRule'] = async (id) => {
    await opsExt.deleteWeightSurchargeRule(id, weightSurchargeRules, user);
    await loadWeightSurchargeRules();
  };

  const getWeightSurcharge: FreightContextType['getWeightSurcharge'] = (agent, weight, date) => {
    return helpers.getWeightSurcharge(weightSurchargeRules, agent, weight, date);
  };

  // Calculation History Operations
  const addCalculationHistory: FreightContextType['addCalculationHistory'] = async (history) => {
    await ops.addCalculationHistory(history, user);
    await loadCalculationHistory();
  };

  const deleteCalculationHistory: FreightContextType['deleteCalculationHistory'] = async (id) => {
    await ops.deleteCalculationHistory(id);
    await loadCalculationHistory();
  };

  const getCalculationHistoryById: FreightContextType['getCalculationHistoryById'] = (id) => {
    return calculationHistory.find((h) => h.id === id);
  };

  // Quotation Operations
  const addQuotation: FreightContextType['addQuotation'] = async (quotation) => {
    await ops.addQuotation(quotation, user);
    await loadQuotations();
  };

  const deleteQuotation: FreightContextType['deleteQuotation'] = async (id) => {
    await ops.deleteQuotation(id);
    await loadQuotations();
  };

  const getQuotationById: FreightContextType['getQuotationById'] = (id) => {
    return quotations.find((q) => q.id === id);
  };

  // Audit Log Operations
  const getAuditLogsForEntity: FreightContextType['getAuditLogsForEntity'] = (entityType, entityId) => {
    return helpers.getAuditLogsForEntity(auditLogs, entityType, entityId);
  };

  const getAuditLogsByType: FreightContextType['getAuditLogsByType'] = (entityType) => {
    return helpers.getAuditLogsByType(auditLogs, entityType);
  };

  const deleteAuditLog: FreightContextType['deleteAuditLog'] = async (id) => {
    await ops.deleteAuditLog(id);
    await loadAuditLogs();
  };

  const clearAuditLogs: FreightContextType['clearAuditLogs'] = async (entityType) => {
    await ops.clearAuditLogs(entityType);
    await loadAuditLogs();
  };

  // Border City Operations
  const addBorderCity: FreightContextType['addBorderCity'] = async (city) => {
    await ops.addBorderCity(city, user);
    await loadBorderCities();
  };

  const updateBorderCity: FreightContextType['updateBorderCity'] = async (id, city) => {
    await ops.updateBorderCity(id, city, borderCities, user);
    await loadBorderCities();
  };

  const deleteBorderCity: FreightContextType['deleteBorderCity'] = async (id) => {
    await ops.deleteBorderCity(id, borderCities, user);
    await loadBorderCities();
  };

  const getBorderCityById: FreightContextType['getBorderCityById'] = (id) => {
    return helpers.getBorderCityById(borderCities, id);
  };

  const getDefaultBorderCity: FreightContextType['getDefaultBorderCity'] = () => {
    return helpers.getDefaultBorderCity(borderCities);
  };

  // System Setting Operations
  const addSystemSetting: FreightContextType['addSystemSetting'] = async (setting) => {
    await ops.addSystemSetting(setting, user);
    await loadSystemSettings();
  };

  const updateSystemSetting: FreightContextType['updateSystemSetting'] = async (id, setting) => {
    await ops.updateSystemSetting(id, setting, systemSettings, user);
    await loadSystemSettings();
  };

  const deleteSystemSetting: FreightContextType['deleteSystemSetting'] = async (id) => {
    await ops.deleteSystemSetting(id, systemSettings, user);
    await loadSystemSettings();
  };

  const getSystemSettingByKey: FreightContextType['getSystemSettingByKey'] = (key) => {
    return helpers.getSystemSettingByKey(systemSettings, key);
  };

  const getSystemSettingValue: FreightContextType['getSystemSettingValue'] = (key, defaultValue) => {
    return helpers.getSystemSettingValue(systemSettings, key, defaultValue);
  };

  // Time Machine Operations
  const getHistoricalSnapshot: FreightContextType['getHistoricalSnapshot'] = (targetDate) => {
    return helpers.getHistoricalSnapshot(
      targetDate,
      seaFreights,
      agentSeaFreights,
      dthcList,
      dpCosts,
      combinedFreights,
      portBorderFreights,
      borderDestinationFreights,
      weightSurchargeRules,
      auditLogs
    );
  };

  const getAvailableHistoricalDates: FreightContextType['getAvailableHistoricalDates'] = () => {
    return helpers.getAvailableHistoricalDates(auditLogs);
  };

  const getHistoricalFreightOptions: FreightContextType['getHistoricalFreightOptions'] = (date, pol, pod) => {
    return helpers.getHistoricalFreightOptions(
      date,
      pol,
      pod,
      seaFreights,
      agentSeaFreights,
      dthcList,
      dpCosts,
      combinedFreights,
      portBorderFreights,
      borderDestinationFreights,
      weightSurchargeRules,
      auditLogs
    );
  };

  // Cost Calculation
  const calculateFreightCost: FreightContextType['calculateCost'] = (input) => {
    const snapshot = input.historicalDate ? getHistoricalSnapshot(input.historicalDate) : null;
    return calculateCost(
      input,
      seaFreights,
      agentSeaFreights,
      dthcList,
      dpCosts,
      combinedFreights,
      portBorderFreights,
      borderDestinationFreights,
      weightSurchargeRules,
      railAgents,
      snapshot
    );
  };

  return (
    <FreightContext.Provider
      value={{
        shippingLines,
        addShippingLine,
        updateShippingLine,
        deleteShippingLine,
        getShippingLineById,
        ports,
        addPort,
        updatePort,
        deletePort,
        getPortById,
        railAgents,
        addRailAgent,
        updateRailAgent,
        deleteRailAgent,
        getRailAgentById,
        truckAgents,
        addTruckAgent,
        updateTruckAgent,
        deleteTruckAgent,
        getTruckAgentById,
        destinations,
        addDestination,
        updateDestination,
        deleteDestination,
        getDestinationById,
        seaFreights,
        addSeaFreight,
        updateSeaFreight,
        deleteSeaFreight,
        getSeaFreightOptions,
        getSeaFreightVersion,
        agentSeaFreights,
        addAgentSeaFreight,
        updateAgentSeaFreight,
        deleteAgentSeaFreight,
        getAgentSeaFreight,
        getAgentSeaFreightVersion,
        dthcList,
        addDTHC,
        updateDTHC,
        deleteDTHC,
        getDTHCByAgentAndRoute,
        dpCosts,
        addDPCost,
        updateDPCost,
        deleteDPCost,
        getDPCost,
        combinedFreights,
        addCombinedFreight,
        updateCombinedFreight,
        deleteCombinedFreight,
        getCombinedFreight,
        portBorderFreights,
        addPortBorderFreight,
        updatePortBorderFreight,
        deletePortBorderFreight,
        getPortBorderRate,
        borderDestinationFreights,
        addBorderDestinationFreight,
        updateBorderDestinationFreight,
        deleteBorderDestinationFreight,
        getBorderDestinationRate,
        weightSurchargeRules,
        addWeightSurchargeRule,
        updateWeightSurchargeRule,
        deleteWeightSurchargeRule,
        getWeightSurcharge,
        calculateCost: calculateFreightCost,
        calculationHistory,
        addCalculationHistory,
        deleteCalculationHistory,
        getCalculationHistoryById,
        quotations,
        addQuotation,
        deleteQuotation,
        getQuotationById,
        auditLogs,
        getAuditLogsForEntity,
        getAuditLogsByType,
        deleteAuditLog,
        clearAuditLogs,
        getHistoricalSnapshot,
        getAvailableHistoricalDates,
        getHistoricalFreightOptions,
        isValidOnDate: helpers.isValidOnDate,
        borderCities,
        addBorderCity,
        updateBorderCity,
        deleteBorderCity,
        getBorderCityById,
        getDefaultBorderCity,
        systemSettings,
        addSystemSetting,
        updateSystemSetting,
        deleteSystemSetting,
        getSystemSettingByKey,
        getSystemSettingValue,
      }}
    >
      {children}
    </FreightContext.Provider>
  );
};

export const useFreight = () => {
  const context = useContext(FreightContext);
  if (context === undefined) {
    throw new Error('useFreight must be used within a FreightProvider');
  }
  return context;
};