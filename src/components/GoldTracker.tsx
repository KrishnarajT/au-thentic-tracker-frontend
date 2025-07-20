import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Plus, Trash2, TrendingUp, RefreshCw, Settings, Calendar, Target, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { goldPurchaseApi, goldPriceApi } from "@/services/goldApi";
import { GoldPurchase } from "@/types/gold";
import { formatCurrency, formatWeight, formatPercentage, CurrencyFormat } from "@/utils/formatters";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import { calculateGoldXIRR } from "@/utils/xirr";

type SortField = 'date' | 'grams' | 'amountPaid' | 'pricePerGram' | 'currentValue' | 'return';
type SortDirection = 'asc' | 'desc';

const GoldTracker = () => {
  const [purchases, setPurchases] = useState<GoldPurchase[]>([]);
  const [currentGoldPrice, setCurrentGoldPrice] = useState<number>(0);
  const [lastMonthGoldPrice, setLastMonthGoldPrice] = useState<number>(0);
  const [currencyFormat, setCurrencyFormat] = useState<CurrencyFormat>('normal');
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isLoadingHistoricalPrice, setIsLoadingHistoricalPrice] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [newPurchase, setNewPurchase] = useState({
    grams: "",
    amountPaid: "",
    date: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  // Load data on component mount
  useEffect(() => {
    loadPurchases();
    fetchCurrentGoldPrice();
    fetchLastMonthGoldPrice();
  }, []);

  const loadPurchases = async () => {
    setIsLoadingData(true);
    const result = await goldPurchaseApi.getAll();
    
    if (result.success && result.data) {
      setPurchases(result.data);
      toast({
        title: "Data Loaded",
        description: "Gold purchases loaded from server",
      });
    } else {
      // Keep existing local state if API fails
      console.log("Using local state - API not available");
    }
    setIsLoadingData(false);
  };

  const fetchCurrentGoldPrice = async () => {
    setIsLoadingPrice(true);
    const result = await goldPriceApi.getCurrentPrice();
    
    if (result.success && result.data) {
      setCurrentGoldPrice(result.data);
      toast({
        title: "Price Updated",
        description: `Current gold price: ₹${result.data.toFixed(2)}/g`,
      });
    } else {
      toast({
        title: "Price Fetch Failed",
        description: "Using manual price input",
        variant: "destructive"
      });
    }
    setIsLoadingPrice(false);
  };

  const fetchLastMonthGoldPrice = async () => {
    setIsLoadingHistoricalPrice(true);
    const result = await goldPriceApi.getHistoricalPrice(30);
    
    if (result.success && result.data) {
      setLastMonthGoldPrice(result.data);
      toast({
        title: "Historical Price Updated",
        description: `30-day old gold price: ₹${result.data.toFixed(2)}/g`,
      });
    } else {
      toast({
        title: "Historical Price Fetch Failed",
        description: "Please enter manually",
        variant: "destructive"
      });
    }
    setIsLoadingHistoricalPrice(false);
  };

  const addPurchase = async () => {
    if (!newPurchase.grams || !newPurchase.amountPaid || !newPurchase.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to add a purchase.",
        variant: "destructive"
      });
      return;
    }

    const grams = parseFloat(newPurchase.grams);
    const amountPaid = parseFloat(newPurchase.amountPaid);
    
    if (grams <= 0 || amountPaid <= 0) {
      toast({
        title: "Invalid Values",
        description: "Grams and amount must be positive numbers.",
        variant: "destructive"
      });
      return;
    }

    const purchaseData = {
      grams,
      amountPaid,
      date: newPurchase.date,
      pricePerGram: amountPaid / grams
    };

    // Try to save to API first
    const result = await goldPurchaseApi.create(purchaseData);
    
    let purchase: GoldPurchase;
    if (result.success && result.data) {
      purchase = result.data;
      toast({
        title: "Purchase Saved",
        description: `Added ${grams}g of gold (saved to server)`,
      });
    } else {
      // Fallback to local state
      purchase = {
        id: Date.now().toString(),
        ...purchaseData
      };
      toast({
        title: "Purchase Added Locally",
        description: `Added ${grams}g of gold (server unavailable)`,
      });
    }

    setPurchases([...purchases, purchase]);
    setNewPurchase({
      grams: "",
      amountPaid: "",
      date: new Date().toISOString().split('T')[0]
    });
  };

  const removePurchase = async (id: string) => {
    // Try to delete from API first
    const result = await goldPurchaseApi.delete(id);
    
    // Update local state regardless of API result
    setPurchases(purchases.filter(p => p.id !== id));
    
    if (result.success) {
      toast({
        title: "Purchase Removed",
        description: "Gold purchase removed from server",
      });
    } else {
      toast({
        title: "Purchase Removed Locally",
        description: "Gold purchase removed (server unavailable)",
      });
    }
  };

  // Basic calculations
  const totalGrams = purchases.reduce((sum, p) => sum + p.grams, 0);
  const totalInvested = purchases.reduce((sum, p) => sum + p.amountPaid, 0);
  const averagePricePerGram = totalGrams > 0 ? totalInvested / totalGrams : 0;
  const currentValue = totalGrams * currentGoldPrice;
  const totalReturn = currentValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  // KPI calculations
  const lastMonthValue = totalGrams * lastMonthGoldPrice;
  const monthlyReturn = currentValue - lastMonthValue;
  const monthlyReturnPercentage = lastMonthValue > 0 ? (monthlyReturn / lastMonthValue) * 100 : 0;

  // Get last investment date and calculate returns since then
  const purchasesByDate = [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastInvestmentDate = purchasesByDate.length > 0 ? purchasesByDate[0].date : null;
  const lastInvestmentPrice = purchasesByDate.length > 0 ? purchasesByDate[0].pricePerGram : 0;
  const returnSinceLastInvestment = lastInvestmentPrice > 0 ? currentGoldPrice - lastInvestmentPrice : 0;
  const returnSinceLastInvestmentPercentage = lastInvestmentPrice > 0 ? (returnSinceLastInvestment / lastInvestmentPrice) * 100 : 0;

  // XIRR calculations
  const totalXIRR = calculateGoldXIRR(purchases, currentGoldPrice) * 100;
  const monthlyXIRR = lastMonthGoldPrice > 0 ? calculateGoldXIRR(purchases, lastMonthGoldPrice, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) * 100 : 0;
  const sinceLastInvestmentXIRR = lastInvestmentDate ? calculateGoldXIRR(purchases, currentGoldPrice, new Date()) * 100 : 0;

  // Sorting function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort purchases based on current sort field and direction
  const sortedPurchases = [...purchases].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'date':
        aValue = new Date(a.date);
        bValue = new Date(b.date);
        break;
      case 'grams':
        aValue = a.grams;
        bValue = b.grams;
        break;
      case 'amountPaid':
        aValue = a.amountPaid;
        bValue = b.amountPaid;
        break;
      case 'pricePerGram':
        aValue = a.pricePerGram;
        bValue = b.pricePerGram;
        break;
      case 'currentValue':
        aValue = a.grams * currentGoldPrice;
        bValue = b.grams * currentGoldPrice;
        break;
      case 'return':
        aValue = (a.grams * currentGoldPrice) - a.amountPaid;
        bValue = (b.grams * currentGoldPrice) - b.amountPaid;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Prepare chart data
  const chartData = purchases
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc, purchase, index) => {
      const cumulativeInvested = purchases
        .slice(0, index + 1)
        .reduce((sum, p) => sum + p.amountPaid, 0);
      const cumulativeGrams = purchases
        .slice(0, index + 1)
        .reduce((sum, p) => sum + p.grams, 0);
      const cumulativeValue = cumulativeGrams * currentGoldPrice;
      const cumulativeReturn = cumulativeValue - cumulativeInvested;

      acc.push({
        date: purchase.date,
        invested: cumulativeInvested,
        returns: cumulativeReturn,
        value: cumulativeValue
      });
      return acc;
    }, [] as Array<{ date: string; invested: number; returns: number; value: number }>);

  const chartConfig = {
    invested: {
      label: "Total Invested",
      color: "hsl(var(--chart-1))",
    },
    returns: {
      label: "Total Returns",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-muted to-background p-4">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="text-center space-y-2 flex-1">
            <h1 className="text-4xl font-bold text-foreground">Gold Portfolio Tracker</h1>
            <p className="text-muted-foreground">Track your gold investments and calculate returns</p>
          </div>
          
          {/* Currency Format Selector */}
          <Card className="w-64">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium text-muted-foreground">Display Format</label>
                <Select value={currencyFormat} onValueChange={(value: CurrencyFormat) => setCurrencyFormat(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="thousands">Thousands (K)</SelectItem>
                    <SelectItem value="lacs">Lacs (L)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Gold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold">{formatWeight(totalGrams)}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalInvested, currencyFormat)}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(currentValue, currencyFormat)}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold flex items-center gap-1 ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                <TrendingUp className="w-5 h-5" />
                {formatCurrency(totalReturn, currencyFormat)}
                <span className="text-sm">({formatPercentage(returnPercentage)})</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                XIRR: {formatPercentage(totalXIRR)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                30-Day Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold flex items-center gap-1 ${monthlyReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(monthlyReturn, currencyFormat)}
                <span className="text-sm">({formatPercentage(monthlyReturnPercentage)})</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                XIRR: {formatPercentage(monthlyXIRR)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Since Last Investment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold flex items-center gap-1 ${returnSinceLastInvestment >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(returnSinceLastInvestment * totalGrams, currencyFormat)}
                <span className="text-sm">({formatPercentage(returnSinceLastInvestmentPercentage)})</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {lastInvestmentDate && `Since ${lastInvestmentDate}`}
              </div>
              <div className="text-xs text-muted-foreground">
                XIRR: {formatPercentage(sinceLastInvestmentXIRR)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio XIRR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${totalXIRR >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatPercentage(totalXIRR)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Annualized Return Rate
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gold Price Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Gold Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground">Price per gram (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={currentGoldPrice}
                    onChange={(e) => setCurrentGoldPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Enter current gold price per gram"
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={fetchCurrentGoldPrice} 
                  disabled={isLoadingPrice}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingPrice ? 'animate-spin' : ''}`} />
                  {isLoadingPrice ? 'Fetching...' : 'Fetch Price'}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Your average: {formatCurrency(averagePricePerGram, currencyFormat)}/g
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>30-Day Old Gold Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground">Price per gram (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={lastMonthGoldPrice}
                    onChange={(e) => setLastMonthGoldPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Enter gold price from 30 days ago"
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={fetchLastMonthGoldPrice} 
                  disabled={isLoadingHistoricalPrice}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingHistoricalPrice ? 'animate-spin' : ''}`} />
                  {isLoadingHistoricalPrice ? 'Fetching...' : 'Fetch Historical'}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                For 30-day return calculation
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Investment vs Value</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value, currencyFormat)}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number, name: string) => [
                          formatCurrency(value, currencyFormat),
                          name === "invested" ? "Total Invested" : "Investment + Returns"
                        ]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="invested"
                        stroke="var(--color-invested)"
                        strokeWidth={3}
                        dot={{ fill: "var(--color-invested)" }}
                        name="Total Invested"
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--color-returns)"
                        strokeWidth={3}
                        dot={{ fill: "var(--color-returns)" }}
                        name="Investment + Returns"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader>
                <CardTitle>Returns Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value, currencyFormat)}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number) => [
                          formatCurrency(value, currencyFormat),
                          "Total Returns"
                        ]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="returns"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--chart-3))" }}
                        name="Total Returns"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add New Purchase */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Purchase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Grams</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPurchase.grams}
                  onChange={(e) => setNewPurchase({...newPurchase, grams: e.target.value})}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Amount Paid (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPurchase.amountPaid}
                  onChange={(e) => setNewPurchase({...newPurchase, amountPaid: e.target.value})}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date</label>
                <Input
                  type="date"
                  value={newPurchase.date}
                  onChange={(e) => setNewPurchase({...newPurchase, date: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addPurchase} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Purchase
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchases Table */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading purchases...
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No purchases recorded yet. Add your first gold purchase above!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('date')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Date
                        {sortField === 'date' ? (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('grams')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Grams
                        {sortField === 'grams' ? (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('amountPaid')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Amount Paid
                        {sortField === 'amountPaid' ? (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('pricePerGram')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Price/Gram
                        {sortField === 'pricePerGram' ? (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('currentValue')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Current Value
                        {sortField === 'currentValue' ? (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('return')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Return
                        {sortField === 'return' ? (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPurchases.map((purchase) => {
                    const currentValue = purchase.grams * currentGoldPrice;
                    const returnAmount = currentValue - purchase.amountPaid;
                    const returnPercent = purchase.amountPaid > 0 ? (returnAmount / purchase.amountPaid) * 100 : 0;
                    
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell>{purchase.date}</TableCell>
                        <TableCell className="font-medium">{formatWeight(purchase.grams)}</TableCell>
                        <TableCell>{formatCurrency(purchase.amountPaid, currencyFormat)}</TableCell>
                        <TableCell>{formatCurrency(purchase.pricePerGram, currencyFormat)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(currentValue, currencyFormat)}</TableCell>
                        <TableCell className={returnAmount >= 0 ? 'text-success' : 'text-destructive'}>
                          {formatCurrency(returnAmount, currencyFormat)} ({formatPercentage(returnPercent)})
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePurchase(purchase.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoldTracker;