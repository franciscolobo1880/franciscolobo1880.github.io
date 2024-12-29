begin
    using Quantica
    using Parameters
    using ProgressMeter
    using LinearAlgebra
    using LinearMaps
    using ArnoldiMethod
    using Statistics
    using CairoMakie
    CairoMakie.activate!(type = "png")
    path = "/home/lobo/GitHub/franciscolobo1880.github.io/files/publications/HFB1D/julia codes/OregLutchyn/"
end;

# ----- Building Oreg-Lutchyn's Majorana nanowire -----
begin
    const ħ2ome = 76.2 # meV
    const σ0τz = @SMatrix[1 0 0 0; 0 1 0 0; 0 0 -1 0; 0 0 0 -1]
    const σyτy = @SMatrix[0 0 0 -1; 0 0 1 0; 0 1 0 0; -1 0 0 0]
    const σyτz = @SMatrix[0 -im 0 0; im 0 0 0; 0 0 0 im; 0 0 -im 0]
    const σzτz = @SMatrix[1 0 0 0; 0 -1 0 0; 0 0 -1 0; 0 0 0 1]
end;

@with_kw struct Params @deftype Float64
    L  = Inf    # nm
    a0 = 10.0   # nm
    m0 = 0.023  # InAs
end;

build_OregLutchyn_wire(; kw...) = build_OregLutchyn_wire(Params(; kw...))
function build_OregLutchyn_wire(p::Params)
    @unpack L, a0, m0 = p
    t = ħ2ome/(2m0*a0^2) #meV (ħ²/mₑ)

    lat = LP.linear(; a0)

    modelN = @onsite((; μ=0.0, Vz=0.0) -> (2*t-μ)*σ0τz + Vz*σzτz) - hopping(t*σ0τz)
    modelS = @onsite((; Δ0=0.0) -> Δ0*σyτy)
    modelSOC = @hopping((r, dr; α=0.0) -> α*(im*dr[1]/(2a0^2))*σyτz)
    model = modelN + modelSOC + modelS

    h = lat |> hamiltonian(model, orbitals=4)

    if isfinite(L) h=supercell(h, region = r -> 0 <= r[1] <= L) end

    return h
end

# ----- Calculating band structure, band gap, band spectrum and Pfaffian -----
begin
    hinf = build_OregLutchyn_wire(L=Inf)
    hfin = build_OregLutchyn_wire(L=2000.0)
    Pfaffian(μ, Δ0) = sqrt(μ^2+Δ0^2)
    
    ks  = subdiv(-π, π, 1000)
    Vzs = range(0.0, 1.0, 144)
    μs  = range(-1.0, 1.0, 144) 
    params = (; α=40.0, Δ0=0.4, μ=0.0, Vz=0.0)
end

# ----- Plotting band structure -----
BTS = bands(hinf(;params..., Vz=0.5), ks)
begin
    fig = Figure(size=(600, 500))
    ax = Axis(fig[1,1], ylabel=L"ϵ\text{ (meV)}", xlabel=L"k \text{ (nm)}^{-1}", xlabelsize=25, ylabelsize=25)
    qplot!(BTS; color=:black, hide=:nodes, font=100)
    xlims!(-0.5, 0.5)
    ylims!(-2, 2)
    hidexdecorations!(ax; label=false, grid=false)
    hideydecorations!(ax; label=false, grid=false)
    display(fig)    
    save(path*"OL_bands.png", fig)
end
begin
    fig = Figure(size=(600,500))
    ax = Axis(fig[1,1], ylabel=L"ϵ\text{ (meV)}", xlabel=L"k \text{ (nm)}^{-1}", xlabelsize=20, ylabelsize=20, xticks=([-π, -π/2, 0, π/2, π], ["-π", "-π/2", "0", "π/2", "π"]), yticks=(-60:10:60, string.(-60:10:60)))
    record(fig, path*"BST.gif", eachindex(Vzs)) do iVz
        BTS = bands(hinf(;params..., Vz=Vzs[iVz]), ks)
        empty!(ax)   
        qplot!(BTS, color=:black, hide=:nodes)
        xlims!(-0.5, 0.5)
        ylims!(-2, 2)
    end
end

# ----- Plotting phase diagram-----
Ωs = [Quantica.gap(hinf(;params..., Δ0=0.4, Vz=Vz, μ=μ); nev=2) for Vz in Vzs, μ in μs]
begin
    fig = Figure(size=(620, 500))
    ax = Axis(fig[1, 1], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel = L"μ\ \text{(meV)}", xlabelsize=25, ylabelsize=25)
    hm = heatmap!(ax, Vzs, μs, Ωs, colormap=cgrad(:inferno), colorrange=(0,0.401), highclip=cgrad(:inferno)[end])    
    bar = Colorbar(fig[1, 2], hm, label=L"Ω\text{ (meV)}", labelsize=25, ticksvisible=false, ticklabelsvisible=false)    
    lines!(Pfaffian.(μs, params.Δ0), μs, color=:white, linestyle=:dash) 
    hlines!(ax, 0.0, linestyle=Linestyle([0, 15, 20]), color=:red)
    xlims!(Vzs[begin], Vzs[end])
    hidexdecorations!(ax; label=false, grid=false)
    hideydecorations!(ax; label=false, grid=false)
    display(fig)
    save(path*"OL_phasediagram.png", fig)
end

# ----- Plotting spectrum versus Zeeman -----
BSP = bands(hfin, Vzs; mapping=Vz -> ftuple(;params..., α=10, Vz), solver=ES.ShiftInvert(ES.ArnoldiMethod(nev = 100), 0))
begin
    fig = Figure(size=(900, 500))
    ax = Axis(fig[1, 1], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel=L"ϵ\text{ (meV)}", xlabelsize=25, ylabelsize=25)
    hlines!(ax, 0.0, color=:gray90)
    qplot!(BSP, color=:black, hide=:nodes)
    ylims!(-0.4, 0.4)
    xlims!(Vzs[begin], Vzs[end])
    hidexdecorations!(ax; label=false)
    hideydecorations!(ax; label=false)
    display(fig)
    save(path*"OL_spectrum.png", fig)
end